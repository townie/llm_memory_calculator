#!/usr/bin/env python3
"""
Script to fetch Google Cloud Platform (GCP) GPU instance information and pricing.
This script retrieves information about GCP instances with GPUs,
including A3, A2, G2, H3 and other families with various NVIDIA GPUs.
"""

import os
import json
import requests
from datetime import datetime
from typing import Dict, List, Any, Optional

# GCP pricing API endpoint
GCP_PRICING_API = "https://cloudbilling.googleapis.com/v1/services/6F81-5844-456A/skus"

# GPU instance machine type prefixes
GPU_MACHINE_TYPE_PREFIXES = [
    "a3-", "a2-", "g2-", "n1-", "n2-", "n2d-", "c2-", "c2d-", "h3-"
]

# GPU models available in GCP
GPU_MODELS = {
    "nvidia-h100-80gb": {"name": "NVIDIA H100", "memory_gb": 80},
    "nvidia-a100-80gb": {"name": "NVIDIA A100", "memory_gb": 80},
    "nvidia-a100": {"name": "NVIDIA A100", "memory_gb": 40},
    "nvidia-l4": {"name": "NVIDIA L4", "memory_gb": 24},
    "nvidia-t4": {"name": "NVIDIA T4", "memory_gb": 16},
    "nvidia-v100": {"name": "NVIDIA V100", "memory_gb": 16},
    "nvidia-p100": {"name": "NVIDIA P100", "memory_gb": 16},
    "nvidia-p4": {"name": "NVIDIA P4", "memory_gb": 8},
    "nvidia-k80": {"name": "NVIDIA K80", "memory_gb": 12},
}

# Machine series to GPU mapping (default configurations)
MACHINE_GPU_MAP = {
    "a3": {"model": "nvidia-h100-80gb", "default_count": 8},
    "a2": {"model": "nvidia-a100", "default_count": 4},  # Can be 40GB or 80GB
    "g2": {"model": "nvidia-l4", "default_count": 1},    # Variable count
    "h3": {"model": "nvidia-h100-80gb", "default_count": 8},
}

def get_compute_engine_products() -> List[Dict[str, Any]]:
    """
    Retrieve GCP Compute Engine product data from the pricing API.

    Returns:
        List[Dict[str, Any]]: List of product data
    """
    try:
        # Using the public pricing API
        response = requests.get(GCP_PRICING_API)
        response.raise_for_status()
        data = response.json()
        return data.get('skus', [])
    except Exception as e:
        print(f"Error fetching GCP pricing data: {e}")
        return []

def filter_gpu_instances(skus: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Filter the SKUs to only include GPU-related instances.

    Args:
        skus: List of SKU data from the pricing API

    Returns:
        List[Dict[str, Any]]: Filtered list of GPU instance data
    """
    gpu_instances = []
    gpu_attachments = {}

    # First, find GPU accelerator attachments
    for sku in skus:
        category = sku.get('category', {}).get('resourceFamily', '')
        service_tier = sku.get('category', {}).get('serviceDisplayName', '')

        # Check if it's a GPU accelerator
        if (category == 'Compute' and
            'GPU' in sku.get('description', '') and
            'cost' in sku.get('description', '').lower()):

            # Extract GPU type from description
            description = sku['description']
            gpu_type = None
            for gpu_key in GPU_MODELS.keys():
                if gpu_key.upper() in description.upper() or GPU_MODELS[gpu_key]['name'].upper() in description.upper():
                    gpu_type = gpu_key
                    break

            if gpu_type:
                price = None
                for tier in sku.get('pricingInfo', []):
                    for p in tier.get('pricingExpression', {}).get('tieredRates', []):
                        if p.get('unitPrice', {}).get('units', 0) > 0 or p.get('unitPrice', {}).get('nanos', 0) > 0:
                            units = int(p.get('unitPrice', {}).get('units', 0))
                            nanos = int(p.get('unitPrice', {}).get('nanos', 0)) / 1_000_000_000
                            price = units + nanos
                            break

                regions = []
                for geo_attribute in sku.get('serviceRegions', []):
                    regions.append(geo_attribute)

                for region in regions:
                    gpu_attachments.setdefault(region, {})
                    gpu_attachments[region][gpu_type] = {
                        'price_per_hour': price,
                        'price_per_hour_usd': price,  # Adding USD-specific field for consistency
                        'description': description,
                        'gpu_model': GPU_MODELS.get(gpu_type, {}).get('name', 'Unknown'),
                        'memory_gb': GPU_MODELS.get(gpu_type, {}).get('memory_gb', 0)
                    }

    # Now find VM instances and match them with GPUs
    for sku in skus:
        category = sku.get('category', {}).get('resourceFamily', '')
        service_tier = sku.get('category', {}).get('serviceDisplayName', '')

        # Only process compute VM instances
        if category == 'Compute' and service_tier == 'Compute Engine':
            description = sku.get('description', '')

            # Check if this is a machine type we're interested in
            machine_type = None
            for prefix in GPU_MACHINE_TYPE_PREFIXES:
                if prefix in description.lower():
                    machine_type = description
                    break

            if machine_type:
                # Extract details from the machine type
                instance_details = {
                    'machine_type': machine_type,
                    'description': description,
                    'regions': sku.get('serviceRegions', []),
                    'vcpus': 0,
                    'memory_gb': 0
                }

                # Try to extract CPU and memory information from the description
                parts = description.split()
                for i, part in enumerate(parts):
                    if part.lower() == 'vcpu' or part.lower() == 'vcpus':
                        try:
                            instance_details['vcpus'] = int(parts[i-1])
                        except (ValueError, IndexError):
                            pass
                    if 'gb' in part.lower() and i > 0:
                        try:
                            instance_details['memory_gb'] = float(parts[i-1])
                        except (ValueError, IndexError):
                            pass

                # Get pricing
                price = None
                for tier in sku.get('pricingInfo', []):
                    for p in tier.get('pricingExpression', {}).get('tieredRates', []):
                        if p.get('unitPrice', {}).get('units', 0) > 0 or p.get('unitPrice', {}).get('nanos', 0) > 0:
                            units = int(p.get('unitPrice', {}).get('units', 0))
                            nanos = int(p.get('unitPrice', {}).get('nanos', 0)) / 1_000_000_000
                            price = units + nanos
                            break

                instance_details['price_per_hour'] = price
                instance_details['price_per_hour_usd'] = price  # Adding USD-specific field for consistency

                # Determine the GPU model and count based on machine type
                machine_series = None
                for series in MACHINE_GPU_MAP:
                    if machine_type.lower().startswith(series):
                        machine_series = series
                        break

                if machine_series:
                    gpu_model = MACHINE_GPU_MAP[machine_series]['model']
                    gpu_count = MACHINE_GPU_MAP[machine_series]['default_count']

                    # Adjust count based on machine type size
                    if 'highgpu' in machine_type.lower():
                        gpu_count = 8  # Typically high-GPU machines have 8 GPUs
                    elif 'standard' in machine_type.lower():
                        gpu_count = 4  # Standard GPU count is often 4

                    # Try to extract the GPU count from the description
                    for i, part in enumerate(parts):
                        if part.lower() == 'gpu' or part.lower() == 'gpus':
                            try:
                                gpu_count = int(parts[i-1])
                            except (ValueError, IndexError):
                                pass

                    # Add GPU information
                    for region in instance_details['regions']:
                        if region in gpu_attachments and gpu_model in gpu_attachments[region]:
                            instance_details['gpu_model'] = gpu_attachments[region][gpu_model]['gpu_model']
                            instance_details['gpu_memory_gb'] = gpu_attachments[region][gpu_model]['memory_gb']
                            instance_details['gpu_count'] = gpu_count
                            instance_details['total_gpu_memory_gb'] = gpu_count * gpu_attachments[region][gpu_model]['memory_gb']
                            # Add the GPU pricing to the instance pricing
                            gpu_price = gpu_attachments[region][gpu_model]['price_per_hour'] * gpu_count
                            if instance_details['price_per_hour']:
                                # Only add if we have VM pricing data
                                instance_details['total_price_per_hour'] = instance_details['price_per_hour'] + gpu_price
                                instance_details['total_price_per_hour_usd'] = instance_details['total_price_per_hour']  # Adding USD-specific field
                                # Calculate derived metrics
                                instance_details['price_per_gpu_hour'] = instance_details['total_price_per_hour'] / gpu_count
                                instance_details['price_per_gpu_hour_usd'] = instance_details['price_per_gpu_hour']  # Adding USD-specific field
                                if instance_details['total_gpu_memory_gb'] > 0:
                                    instance_details['price_per_gpu_gb_hour'] = (
                                        instance_details['total_price_per_hour'] / instance_details['total_gpu_memory_gb']
                                    )
                                    instance_details['price_per_gpu_gb_hour_usd'] = instance_details['price_per_gpu_gb_hour']  # Adding USD-specific field
                            gpu_instances.append(instance_details)

    return gpu_instances

def save_results(instances: List[Dict[str, Any]], filename: str = None):
    """
    Save the results to a JSON file.

    Args:
        instances: List of instance data
        filename: Optional filename, defaults to a timestamped file
    """
    if filename is None:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"gcp_gpu_instances_{timestamp}.json"

    output_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "data")
    os.makedirs(output_dir, exist_ok=True)

    output_path = os.path.join(output_dir, filename)

    with open(output_path, 'w') as f:
        json.dump({
            "generated_at": datetime.now().isoformat(),
            "instances": instances
        }, f, indent=2)

    print(f"Data saved to {output_path}")

    # Also save a static copy for the application to use
    static_path = os.path.join(output_dir, "gcp_gpu_instances.json")
    with open(static_path, 'w') as f:
        json.dump({
            "generated_at": datetime.now().isoformat(),
            "instances": instances
        }, f, indent=2)

    print(f"Data also saved to {static_path}")

def main():
    """Main function to execute the script."""
    print("Fetching GCP GPU instance information...")
    products = get_compute_engine_products()
    print(f"Found {len(products)} GCP products")

    print("Filtering for GPU instances...")
    gpu_instances = filter_gpu_instances(products)
    print(f"Found {len(gpu_instances)} GPU instances")

    print("Saving results...")
    save_results(gpu_instances)

    print("Done!")

if __name__ == "__main__":
    main()
