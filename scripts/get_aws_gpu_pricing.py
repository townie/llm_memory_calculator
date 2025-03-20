#!/usr/bin/env python3
"""
Script to fetch AWS GPU instance information and pricing.
This script retrieves information about AWS instances with GPUs,
including P5e, P5, P4, P3, G3, G4, G5, G6, G6e, and G5g families.
"""

import boto3
import json
import os
from typing import Dict, List, Any, Optional
from datetime import datetime

# GPU instance families we want to track
GPU_INSTANCE_FAMILIES = [
    "p5en",
    "p5e",
    "p5",
    "p4d",
    "p4de",
    "p3",
    "p3dn",
    "g3",
    "g4dn",
    "g5",
    "g6",
    "g6e",
    "g5g",
]

# GPU models mapping to their instance families
GPU_MODEL_MAP = {
    "p5e": "NVIDIA H200",
    "p5": "NVIDIA H100",
    "p4d": "NVIDIA A100",
    "p4de": "NVIDIA A100",
    "p3": "NVIDIA V100",
    "p3dn": "NVIDIA V100",
    "g3": "NVIDIA M60",
    "g4dn": "NVIDIA T4",
    "g5": "NVIDIA A10G",
    "g6": "NVIDIA L4",
    "g6e": "NVIDIA L40S",
    "g5g": "AWS Graviton2 (ARM)",
}

# GPU memory sizes (in GB)
GPU_MEMORY_MAP = {
    "NVIDIA H200": 141,
    "NVIDIA H100": 80,
    "NVIDIA A100": 80,  # 40GB or 80GB variants exist
    "NVIDIA V100": 16,  # 16GB or 32GB variants exist
    "NVIDIA M60": 8,
    "NVIDIA T4": 16,
    "NVIDIA A10G": 24,
    "NVIDIA L4": 24,
    "NVIDIA L40S": 48,
    "AWS Graviton2 (ARM)": 0,  # Not actually a dedicated GPU
}


def get_instance_types() -> List[Dict[str, Any]]:
    """
    Get information about all instance types.

    Returns:
        List[Dict[str, Any]]: List of instance data dictionaries
    """
    ec2 = boto3.client("ec2", region_name="us-east-1")

    # Get all instance types
    instance_types = []
    paginator = ec2.get_paginator("describe_instance_types")

    for page in paginator.paginate():
        for instance_type in page["InstanceTypes"]:
            # Filter for GPU instances only
            if any(
                instance_type["InstanceType"].startswith(family)
                for family in GPU_INSTANCE_FAMILIES
            ):
                gpu_info = None
                gpu_count = 0
                gpu_model = None
                gpu_memory = 0

                # Extract GPU information
                if "GpuInfo" in instance_type:
                    gpu_info = instance_type["GpuInfo"]

                    if "Gpus" in gpu_info:
                        gpu_count_len = len(gpu_info["Gpus"])
                        if gpu_count_len == 0:
                            gpu_count = gpu_info["Gpus"][0].get("Count", 1)
                            gpu_model = gpu_info["Gpus"][0].get("Name", "Unknown")
                            gpu_memory = (
                                gpu_info["Gpus"][0]
                                .get("MemoryInfo", {})
                                .get("SizeInMiB", 0)
                            )  # / 1024  # Convert to GB

                # If GPU info not available from API, use our mapping
                if not gpu_model or gpu_memory == 0:
                    for family, model in GPU_MODEL_MAP.items():
                        if instance_type["InstanceType"].startswith(family):
                            gpu_model = model
                            gpu_memory = GPU_MEMORY_MAP.get(model, 0)
                            break

                # For GPU counts if not provided
                if gpu_count == 0:
                    # Simple heuristic based on instance size (not always accurate)
                    instance_size = instance_type["InstanceType"].split(".")[-1]
                    if "24xlarge" in instance_size:
                        gpu_count = 8
                    elif "16xlarge" in instance_size or "12xlarge" in instance_size:
                        gpu_count = 4
                    elif "8xlarge" in instance_size:
                        gpu_count = 2
                    elif "xlarge" in instance_size:
                        gpu_count = 1

                instance_data = {
                    "instance_type": instance_type["InstanceType"],
                    "family": next(
                        (
                            f
                            for f in GPU_INSTANCE_FAMILIES
                            if instance_type["InstanceType"].startswith(f)
                        ),
                        "unknown",
                    ),
                    "vcpus": instance_type.get("VCpuInfo", {}).get("DefaultVCpus", 0),
                    "memory_gb": instance_type.get("MemoryInfo", {}).get("SizeInMiB", 0)
                    / 1024,  # Convert to GB
                    "gpu_count": gpu_count,
                    "gpu_model": gpu_model,
                    "gpu_memory_gb": gpu_memory,
                    "total_gpu_memory_gb": gpu_count * gpu_memory,
                }
                instance_types.append(instance_data)

    return instance_types


def get_instance_pricing(instance_types: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Get pricing information for the provided instance types.

    Args:
        instance_types: List of instance type dictionaries

    Returns:
        List[Dict[str, Any]]: List of instance data with pricing
    """
    pricing = boto3.client("pricing", region_name="us-east-1")

    for instance in instance_types:
        try:
            response = pricing.get_products(
                ServiceCode="AmazonEC2",
                Filters=[
                    {
                        "Type": "TERM_MATCH",
                        "Field": "instanceType",
                        "Value": instance["instance_type"],
                    },
                    {
                        "Type": "TERM_MATCH",
                        "Field": "operatingSystem",
                        "Value": "Linux",
                    },
                    {"Type": "TERM_MATCH", "Field": "tenancy", "Value": "Shared"},
                    {"Type": "TERM_MATCH", "Field": "capacitystatus", "Value": "Used"},
                    {"Type": "TERM_MATCH", "Field": "preInstalledSw", "Value": "NA"},
                ],
            )

            if response["PriceList"]:
                price_data = json.loads(response["PriceList"][0])
                terms = price_data.get("terms", {}).get("OnDemand", {})
                if terms:
                    # Get the first pricing dimension
                    term_key = next(iter(terms))
                    price_dimensions = terms[term_key].get("priceDimensions", {})
                    dim_key = next(iter(price_dimensions))
                    price_per_unit = price_dimensions[dim_key].get("pricePerUnit", {})

                    if "USD" in price_per_unit:
                        instance["price_per_hour_usd"] = float(price_per_unit["USD"])
                    elif "CNY" in price_per_unit:
                        # Convert CNY to USD using approximate fixed rate
                        cny_to_usd_rate = (
                            0.14  # This rate should be updated periodically
                        )
                        instance["price_per_hour_usd"] = (
                            float(price_per_unit["CNY"]) * cny_to_usd_rate
                        )
                    else:
                        instance["price_per_hour_usd"] = None
                else:
                    instance["price_per_hour_usd"] = None
            else:
                instance["price_per_hour_usd"] = None

        except Exception as e:
            print(f"Error getting pricing for {instance['instance_type']}: {e}")
            instance["price_per_hour_usd"] = None

    return instance_types


def calculate_derived_metrics(instances: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Calculate additional metrics for each instance.

    Args:
        instances: List of instance dictionaries

    Returns:
        List[Dict[str, Any]]: Enhanced list with additional metrics
    """
    for instance in instances:
        # Skip instances with no pricing data
        if instance.get("price_per_hour_usd") is None:
            del instance
            continue

        # Calculate price per GPU per hour
        if instance["gpu_count"] > 0:
            instance["price_per_gpu_hour"] = (
                instance["price_per_hour_usd"] / instance["gpu_count"]
            )
        else:
            instance["price_per_gpu_hour"] = None

        # Calculate price per GB of GPU memory per hour
        if instance.get("total_gpu_memory_gb", 0) > 0:
            instance["price_per_gpu_gb_hour"] = (
                instance["price_per_hour_usd"] / instance["total_gpu_memory_gb"]
            )
        else:
            instance["price_per_gpu_gb_hour"] = None

    return instances


def save_results(instances: List[Dict[str, Any]], filename: str = None):
    """
    Save the results to a JSON file.

    Args:
        instances: List of instance data
        filename: Optional filename, defaults to a timestamped file
    """
    if filename is None:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"aws_gpu_instances_{timestamp}.json"

    output_dir = os.path.join(
        os.path.dirname(os.path.abspath(__file__)), "..", "public", "data"
    )
    os.makedirs(output_dir, exist_ok=True)

    output_path = os.path.join(output_dir, filename)

    with open(output_path, "w") as f:
        json.dump(
            {"generated_at": datetime.now().isoformat(), "instances": instances},
            f,
            indent=2,
        )

    print(f"Data saved to {output_path}")

    # Also save a static copy for the application to use
    static_path = os.path.join(output_dir, "aws_gpu_instances.json")
    with open(static_path, "w") as f:
        json.dump(
            {"generated_at": datetime.now().isoformat(), "instances": instances},
            f,
            indent=2,
        )

    print(f"Data also saved to {static_path}")


def main():
    """Main function to execute the script."""
    print("Fetching AWS GPU instance information...")
    instance_types = get_instance_types()
    print(f"Found {len(instance_types)} GPU instance types")

    print("Fetching pricing information...")
    instances_with_pricing = get_instance_pricing(instance_types)

    print("Calculating additional metrics...")
    final_instances = calculate_derived_metrics(instances_with_pricing)

    print("Saving results...")
    save_results(final_instances)

    print("Done!")


if __name__ == "__main__":
    main()
