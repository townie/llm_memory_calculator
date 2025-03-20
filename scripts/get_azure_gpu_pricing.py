#!/usr/bin/env python3
"""
Script to fetch Microsoft Azure GPU instance information and pricing.
This script retrieves information about Azure VM instances with GPUs,
including NC, ND, NG, and NV families with various NVIDIA and AMD GPUs.
"""

import os
import json
import requests
from datetime import datetime
from typing import Dict, List, Any, Optional

# Azure offers several GPU families as provided:
# NC-family: Compute-intensive, Graphics-intensive, Visualization
# ND-family: Large memory compute-intensive, Large memory graphics-intensive, Large memory visualization
# NG-family: Virtual Desktop (VDI), Cloud gaming
# NV-family: Virtual desktop (VDI), Single-precision compute, Video encoding and rendering

# Azure pricing API endpoint
AZURE_PRICING_API = "https://prices.azure.com/api/retail/prices"

# GPU VM sizes we want to track by family
GPU_VM_FAMILIES = {
    "NC": [
        "NC-series", "NCads_H100_v5-series", "NCCads_H100_v5-series",
        "NCv2-series", "NCv3-series", "NCasT4_v3-series", "NC_A100_v4-series"
    ],
    "ND": [
        "ND_MI300X_v5-series", "ND-H100-v5-series",
        "NDm_A100_v4-series", "ND_A100_v4-series"
    ],
    "NG": ["NGads V620-series"],
    "NV": [
        "NV-series", "NVv3-series", "NVv4-series", "NVadsA10_v5-series"
    ]
}

# GPU models in Azure with their memory sizes in GB
GPU_MODELS = {
    "NVIDIA H100": 80,            # Used in NCads_H100_v5, NDH100_v5
    "NVIDIA A100": 80,            # Used in NC_A100_v4, ND_A100_v4, NDm_A100_v4
    "NVIDIA T4": 16,              # Used in NCasT4_v3
    "NVIDIA V100": 32,            # Used in NCv3
    "NVIDIA P100": 16,            # Used in NCv2
    "NVIDIA K80": 12,             # Used in NC
    "NVIDIA A10": 24,             # Used in NVadsA10_v5
    "NVIDIA M60": 8,              # Used in NV
    "AMD MI300X": 192,            # Used in ND_MI300X_v5
    "AMD V620": 8                 # Used in NGads V620
}

# Series to GPU mapping
SERIES_GPU_MAP = {
    "NCads_H100_v5": {"model": "NVIDIA H100", "count_suffix": {"24": 8, "8": 4, "4": 2, "2": 1}},
    "NCCads_H100_v5": {"model": "NVIDIA H100", "count_suffix": {"24": 8, "8": 4, "4": 2, "2": 1}},
    "ND-H100-v5": {"model": "NVIDIA H100", "count_suffix": {"80": 8, "40": 4}},
    "NC_A100_v4": {"model": "NVIDIA A100", "count_suffix": {"80": 8, "8": 1, "1": 1}},
    "NDm_A100_v4": {"model": "NVIDIA A100", "count_suffix": {"8": 8, "4": 4}},
    "ND_A100_v4": {"model": "NVIDIA A100", "count_suffix": {"8": 8, "4": 4}},
    "NCasT4_v3": {"model": "NVIDIA T4", "count_suffix": {"16": 4, "8": 2, "4": 1, "2": 1, "1": 1}},
    "NCv3": {"model": "NVIDIA V100", "count_suffix": {"32": 4, "16": 2, "8": 1}},
    "NCv2": {"model": "NVIDIA P100", "count_suffix": {"24": 4, "12": 2, "6": 1}},
    "NC": {"model": "NVIDIA K80", "count_suffix": {"12": 4, "6": 2, "1": 1}},
    "NVadsA10_v5": {"model": "NVIDIA A10", "count_suffix": {"24": 4, "8": 1, "4": 1}},
    "NVv3": {"model": "NVIDIA M60", "count_suffix": {"24": 4, "12": 2, "8": 1, "4": 1}},
    "NV": {"model": "NVIDIA M60", "count_suffix": {"24": 4, "12": 2, "6": 1}},
    "ND_MI300X_v5": {"model": "AMD MI300X", "count_suffix": {"8": 8}},
    "NGads V620": {"model": "AMD V620", "count_suffix": {"8": 8, "4": 4, "2": 2, "1": 1}}
}

def get_azure_vm_pricing(filter_to_gpu=True) -> List[Dict[str, Any]]:
    """
    Fetch VM pricing information from Azure's pricing API.

    Args:
        filter_to_gpu: Whether to filter to only GPU VMs

    Returns:
        List[Dict[str, Any]]: List of VM pricing data
    """
    vm_data = []
    next_page = None

    # Base filter for Linux VMs, pay-as-you-go
    base_filter = "serviceName eq 'Virtual Machines' and priceType eq 'Consumption' and productName like '%Windows%' eq false"

    # Add GPU filter if requested
    if filter_to_gpu:
        # Filter to VM families that have GPU capabilities
        series_filters = []
        for family, series_list in GPU_VM_FAMILIES.items():
            for series in series_list:
                # Convert series name to a pattern found in the API
                # E.g. "NC-series" becomes filter for "NC "
                api_pattern = series.replace("-series", " ").replace("series", "")
                series_filters.append(f"contains(skuName, '{api_pattern}')")

        family_filter = " or ".join(series_filters)
        api_filter = f"{base_filter} and ({family_filter})"
    else:
        api_filter = base_filter

    print(f"Using Azure API filter: {api_filter}")

    try:
        # Paginate through results
        while True:
            params = {
                "$filter": api_filter
            }

            if next_page:
                params['$skiptoken'] = next_page

            response = requests.get(AZURE_PRICING_API, params=params)
            response.raise_for_status()
            data = response.json()

            # Extract items from this page
            items = data.get('Items', [])
            vm_data.extend(items)

            # Check for next page
            next_page = data.get('NextPageLink')
            if not next_page:
                break

            # Extract skiptoken from the nextPageLink
            if 'skiptoken' in next_page:
                next_page = next_page.split('skiptoken=')[1].split('&')[0]
            else:
                break

    except Exception as e:
        print(f"Error fetching Azure pricing data: {e}")

    print(f"Retrieved {len(vm_data)} VM pricing records from Azure")
    return vm_data

def process_gpu_instances(vm_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Process the Azure pricing data to extract GPU instance information.

    Args:
        vm_data: Raw pricing data from Azure API

    Returns:
        List[Dict[str, Any]]: Processed GPU instance data
    """
    gpu_instances = []

    for vm in vm_data:
        # Skip items that aren't VM instances
        if vm.get('type') != 'consumption':
            continue

        # Extract basic VM info
        sku_name = vm.get('skuName', '')
        product_name = vm.get('productName', '')

        # Skip non-GPU VMs
        if not any(family in sku_name for family in ['NC', 'ND', 'NG', 'NV']):
            continue

        # Check if this VM has GPU
        has_gpu = False
        gpu_model = None
        gpu_count = 0
        gpu_memory_gb = 0

        # Find which GPU series this VM belongs to
        for series_prefix, gpu_info in SERIES_GPU_MAP.items():
            if series_prefix in product_name or series_prefix in sku_name:
                has_gpu = True
                gpu_model = gpu_info['model']
                gpu_memory_gb = GPU_MODELS.get(gpu_model, 0)

                # Determine GPU count based on the size suffix
                # Extract the VM size from the name (e.g., "Standard_NC24" -> "24")
                size_suffix = None
                for suffix in gpu_info['count_suffix'].keys():
                    if suffix in sku_name.split('_')[-1]:
                        size_suffix = suffix
                        break

                if size_suffix:
                    gpu_count = gpu_info['count_suffix'].get(size_suffix, 1)
                else:
                    # Default to 1 if we can't determine
                    gpu_count = 1

                break

        if not has_gpu:
            continue

        # Extract CPU and memory info from the description
        vcpus = 0
        memory_gb = 0
        description = vm.get('productName', '')

        # Example: "Virtual Machines NC24 v3 Series" - look for numbers
        parts = description.split()
        for part in parts:
            # Extract VM size number, which often correlates with vCPU count
            if any(s in part for s in ['NC', 'ND', 'NG', 'NV']) and any(c.isdigit() for c in part):
                try:
                    # Extract digits from the VM size
                    digits = ''.join(c for c in part if c.isdigit())
                    if digits:
                        vcpus = int(digits)
                except ValueError:
                    pass

        # Azure typically has 4-8GB of RAM per vCPU for GPU VMs
        # This is a heuristic as the API doesn't provide this directly
        memory_gb = vcpus * 6  # Estimate based on common Azure VM configurations

        # Get pricing
        price = float(vm.get('retailPrice', 0))
        region = vm.get('location', 'unknown')
        currency = vm.get('currencyCode', 'USD')

        instance = {
            'vm_size': sku_name,
            'product_name': product_name,
            'description': description,
            'region': region,
            'currency': currency,
            'price_per_hour': price,
            'vcpus': vcpus,
            'memory_gb': memory_gb,
            'gpu_model': gpu_model,
            'gpu_count': gpu_count,
            'gpu_memory_gb': gpu_memory_gb,
            'total_gpu_memory_gb': gpu_count * gpu_memory_gb,
        }

        # Calculate derived metrics
        if gpu_count > 0:
            instance['price_per_gpu_hour'] = price / gpu_count

            if instance['total_gpu_memory_gb'] > 0:
                instance['price_per_gpu_gb_hour'] = price / instance['total_gpu_memory_gb']

        gpu_instances.append(instance)

    # Sort by GPU model and price
    gpu_instances.sort(key=lambda x: (x.get('gpu_model', ''), x.get('price_per_hour', 0)))

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
        filename = f"azure_gpu_instances_{timestamp}.json"

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
    static_path = os.path.join(output_dir, "azure_gpu_instances.json")
    with open(static_path, 'w') as f:
        json.dump({
            "generated_at": datetime.now().isoformat(),
            "instances": instances
        }, f, indent=2)

    print(f"Data also saved to {static_path}")

def main():
    """Main function to execute the script."""
    print("Fetching Azure GPU instance information...")
    vm_pricing_data = get_azure_vm_pricing(filter_to_gpu=True)

    print("Processing GPU instances...")
    gpu_instances = process_gpu_instances(vm_pricing_data)
    print(f"Found {len(gpu_instances)} GPU instances")

    print("Saving results...")
    save_results(gpu_instances)

    print("Done!")

if __name__ == "__main__":
    main()
