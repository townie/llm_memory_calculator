import { useState, useEffect } from 'react';
import Tooltip from './Tooltip';

const CloudCost = ({ memoryRequired }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [cloudProviders, setCloudProviders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchCloudData = async () => {
            try {
                setIsLoading(true);

                const awsResponse = await fetch('/data/aws_gpu_instances.json');
                const awsData = await awsResponse.json();

                const gcpResponse = await fetch('/data/gcp_gpu_instances.json');
                const gcpData = await gcpResponse.json();

                // Structure the providers data
                const providers = [
                    {
                        id: 'aws',
                        name: 'AWS',
                        label: 'Amazon Web Services',
                        instances: awsData.instances
                    },
                    {
                        id: 'gcp',
                        name: 'GCP',
                        label: 'Google Cloud Platform',
                        instances: gcpData.instances
                    }
                    // Add Azure when available
                ];

                setCloudProviders(providers);
            } catch (error) {
                console.error("Error fetching cloud provider data:", error);
                // Fallback to hardcoded data if fetch fails
                setCloudProviders(getFallbackProviders());
            } finally {
                setIsLoading(false);
            }
        };

        fetchCloudData();
    }, []);

    // Fallback providers data if API fetch fails
    const getFallbackProviders = () => [
        {
            id: 'aws',
            name: 'AWS',
            label: 'Amazon Web Services',
            instances: [
                {
                    instance_type: 'p4d.24xlarge',
                    family: 'p4d',
                    vcpus: 96,
                    memory_gb: 1152.0,
                    gpu_count: 8,
                    gpu_model: 'A100',
                    gpu_memory_gb: 40.0,
                    total_gpu_memory_gb: 320.0,
                    price_per_hour_usd: 32.77,
                    price_per_gpu_hour: 4.096,
                    price_per_gpu_gb_hour: 0.1024
                },
                {
                    instance_type: 'p3.2xlarge',
                    family: 'p3',
                    vcpus: 8,
                    memory_gb: 61.0,
                    gpu_count: 1,
                    gpu_model: 'V100',
                    gpu_memory_gb: 16.0,
                    total_gpu_memory_gb: 16.0,
                    price_per_hour_usd: 3.06,
                    price_per_gpu_hour: 3.06,
                    price_per_gpu_gb_hour: 0.19125
                },
                {
                    instance_type: 'g5.2xlarge',
                    family: 'g5',
                    vcpus: 8,
                    memory_gb: 32.0,
                    gpu_count: 1,
                    gpu_model: 'A10G',
                    gpu_memory_gb: 24.0,
                    total_gpu_memory_gb: 24.0,
                    price_per_hour_usd: 1.212,
                    price_per_gpu_hour: 1.212,
                    price_per_gpu_gb_hour: 0.0505
                },
                {
                    instance_type: 'g4dn.xlarge',
                    family: 'g4dn',
                    vcpus: 4,
                    memory_gb: 16.0,
                    gpu_count: 1,
                    gpu_model: 'T4',
                    gpu_memory_gb: 16.0,
                    total_gpu_memory_gb: 16.0,
                    price_per_hour_usd: 0.526,
                    price_per_gpu_hour: 0.526,
                    price_per_gpu_gb_hour: 0.032875
                }
            ]
        },
        // {
        //     id: 'azure',
        //     name: 'Azure',
        //     label: 'Microsoft Azure',
        //     instances: [
        //         {
        //             instance_type: 'NC24ads A100 v4',
        //             family: 'NC',
        //             vcpus: 24,
        //             memory_gb: 220.0,
        //             gpu_count: 8,
        //             gpu_model: 'A100',
        //             gpu_memory_gb: 80.0,
        //             total_gpu_memory_gb: 640.0,
        //             price_per_hour_usd: 32.77,
        //             price_per_gpu_hour: 4.096,
        //             price_per_gpu_gb_hour: 0.0512
        //         },
        //         {
        //             instance_type: 'NC6s v3',
        //             family: 'NC',
        //             vcpus: 6,
        //             memory_gb: 112.0,
        //             gpu_count: 1,
        //             gpu_model: 'V100',
        //             gpu_memory_gb: 16.0,
        //             total_gpu_memory_gb: 16.0,
        //             price_per_hour_usd: 3.06,
        //             price_per_gpu_hour: 3.06,
        //             price_per_gpu_gb_hour: 0.19125
        //         },
        //         {
        //             instance_type: 'NC4as T4 v3',
        //             family: 'NC',
        //             vcpus: 4,
        //             memory_gb: 28.0,
        //             gpu_count: 1,
        //             gpu_model: 'T4',
        //             gpu_memory_gb: 16.0,
        //             total_gpu_memory_gb: 16.0,
        //             price_per_hour_usd: 0.526,
        //             price_per_gpu_hour: 0.526,
        //             price_per_gpu_gb_hour: 0.032875
        //         }
        //     ]
        // },
        // {
        //     id: 'gcp',
        //     name: 'GCP',
        //     label: 'Google Cloud Platform',
        //     instances: [
        //         {
        //             instance_type: 'a2-ultragpu-8g',
        //             family: 'a2',
        //             vcpus: 96,
        //             memory_gb: 1360.0,
        //             gpu_count: 8,
        //             gpu_model: 'A100',
        //             gpu_memory_gb: 80.0,
        //             total_gpu_memory_gb: 640.0,
        //             price_per_hour_usd: 32.80,
        //             price_per_gpu_hour: 4.1,
        //             price_per_gpu_gb_hour: 0.05125
        //         },
        //         {
        //             instance_type: 'a2-highgpu-1g',
        //             family: 'a2',
        //             vcpus: 12,
        //             memory_gb: 170.0,
        //             gpu_count: 1,
        //             gpu_model: 'A100',
        //             gpu_memory_gb: 40.0,
        //             total_gpu_memory_gb: 40.0,
        //             price_per_hour_usd: 3.67,
        //             price_per_gpu_hour: 3.67,
        //             price_per_gpu_gb_hour: 0.09175
        //         },
        //         {
        //             instance_type: 'g2-standard-4',
        //             family: 'g2',
        //             vcpus: 4,
        //             memory_gb: 16.0,
        //             gpu_count: 1,
        //             gpu_model: 'L4',
        //             gpu_memory_gb: 24.0,
        //             total_gpu_memory_gb: 24.0,
        //             price_per_hour_usd: 0.936,
        //             price_per_gpu_hour: 0.936,
        //             price_per_gpu_gb_hour: 0.039
        //         },
        //         {
        //             instance_type: 'n1-standard-4 + T4',
        //             family: 'n1',
        //             vcpus: 4,
        //             memory_gb: 15.0,
        //             gpu_count: 1,
        //             gpu_model: 'T4',
        //             gpu_memory_gb: 16.0,
        //             total_gpu_memory_gb: 16.0,
        //             price_per_hour_usd: 0.52,
        //             price_per_gpu_hour: 0.52,
        //             price_per_gpu_gb_hour: 0.0325
        //         }
        //     ]
        // }
    ];

    // Provider icons mapping
    const providerIcons = {
        aws: (
            <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path href='https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg' fill="#FF9900" />
            </svg>
        ),
        azure: (
            <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M13.05 4.24L6.56 18.05 2 18l5.09-8.76 5.96-5m.95 3.13l-4.6 5.33L8.5 18.05h11.53l-6.03-10.68z" fill="#00ADEF" />
            </svg>
        ),
        gcp: (
            <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3L4 9v6l8 6 8-6V9l-8-6zm0 2.25L17.5 9 12 13.5 6.5 9 12 5.25zM6 11.5v2l6 4.5 6-4.5v-2l-6 4.5-6-4.5z" />
            </svg>
        )
    };

    // Sort instances by cost (lowest first)
    const getSortedInstances = (instances) => {
        // Filter only instances that can run the model
        const compatibleInstances = instances.filter(instance => canRunModel(instance));

        // Sort by hourly rate
        return compatibleInstances.sort((a, b) => a.price_per_hour_usd - b.price_per_hour_usd);
    };

    // Calculate if an instance can run the model based on memory requirements
    const canRunModel = (instance) => {
        return instance.total_gpu_memory_gb >= memoryRequired;
    };

    // Get instance cost per hour
    const getInstanceCost = (instance) => {
        return instance.price_per_hour_usd;
    };

    // Get color class based on hourly cost
    const getCostColorClass = (cost) => {
        if (cost < 1) return 'text-green-400';
        if (cost < 10) return 'text-yellow-400';
        return 'text-red-400';
    };

    // Background color for each row based on whether it can run the model
    const getRowBgClass = (canRun) => {
        return canRun ? 'bg-green-900/10' : 'bg-red-900/10';
    };

    // Get the lowest cost option across all providers
    const getLowestCostOption = () => {
        let lowestCostInstance = null;
        let lowestCost = Infinity;

        cloudProviders.forEach(provider => {
            provider.instances.forEach(instance => {
                if (canRunModel(instance) && instance.price_per_hour_usd < lowestCost) {
                    lowestCostInstance = {
                        ...instance,
                        provider: provider.name,
                        providerId: provider.id
                    };
                    lowestCost = instance.price_per_hour_usd;
                }
            });
        });

        return lowestCostInstance;
    };

    const lowestCostOption = getLowestCostOption();

    // Get all compatible instances across all providers
    const getAllCompatibleInstances = () => {
        const allInstances = [];

        cloudProviders.forEach(provider => {
            provider.instances.forEach(instance => {
                if (canRunModel(instance) && instance.price_per_hour_usd) { // Check for null prices
                    allInstances.push({
                        ...instance,
                        provider: provider.name,
                        providerId: provider.id
                    });
                }
            });
        });

        return allInstances.sort((a, b) => a.price_per_hour_usd - b.price_per_hour_usd);
    };

    // Get all incompatible instances
    const getAllIncompatibleInstances = () => {
        const allInstances = [];

        cloudProviders.forEach(provider => {
            provider.instances.forEach(instance => {
                if (!canRunModel(instance) && instance.price_per_hour_usd) { // Check for null prices
                    allInstances.push({
                        ...instance,
                        provider: provider.name,
                        providerId: provider.id
                    });
                }
            });
        });

        return allInstances;
    };

    const compatibleInstances = getAllCompatibleInstances();
    const incompatibleInstances = getAllIncompatibleInstances();

    if (isLoading) {
        return (
            <div className="mt-6 mb-10">
                <div className="flex items-center mb-2">
                    <h2 className="text-xl font-bold text-cyan-300">Cloud Cost Estimation</h2>
                    <span className="ml-2 text-gray-400">Loading pricing data...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-6 mb-10">
            <div className="flex items-center mb-2">
                <h2 className="text-xl font-bold text-cyan-300">Cloud Cost Estimation</h2>
                <Tooltip content="Estimated hourly cost for running this model on cloud instances with full GPU memory allocation.">
                    <span className="ml-2 text-gray-400 cursor-help inline-flex items-center hover:text-cyan-400 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                        </svg>
                    </span>
                </Tooltip>
            </div>

            {/* Lowest cost option banner */}
            {lowestCostOption && (
                <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 mb-4 flex justify-between items-center">
                    <div>
                        <div className="text-white font-medium mb-1">Lowest Cost Option:</div>
                        <div className="text-green-300 flex items-center">
                            {providerIcons[lowestCostOption.providerId] || null}
                            {lowestCostOption.provider} {lowestCostOption.instance_type} ({lowestCostOption.gpu_count}x {lowestCostOption.gpu_model})
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-xl font-bold text-green-400">${lowestCostOption.price_per_hour_usd.toFixed(2)}</div>
                        <div className="text-sm text-gray-300">per hour</div>
                    </div>
                </div>
            )}

            {/* Single dropdown with all instances */}
            <div className="grid grid-cols-1 gap-3">
                <div className="bg-gray-800 bg-opacity-50 rounded-lg overflow-hidden">
                    <div
                        className={`flex justify-between items-center px-4 py-3 cursor-pointer ${isExpanded ? 'bg-gray-700/50' : ''
                            }`}
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        <div className="flex items-center">
                            <span className="font-semibold text-white">Cloud Providers</span>
                            <span className="ml-2 text-xs text-gray-400">AWS (coming soon: Azure, GCP)</span>
                        </div>
                        <div className="flex items-center">
                            <span className="text-sm mr-2 text-gray-400">
                                {compatibleInstances.length} compatible instances
                            </span>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                                className={`w-4 h-4 text-cyan-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                            </svg>
                        </div>
                    </div>

                    <div className={`transition-all duration-300 overflow-hidden ${isExpanded ? 'max-h-screen' : 'max-h-0'
                        }`}>
                        <div className="px-4 py-3">
                            <div className="space-y-2">
                                {compatibleInstances.map((instance) => {
                                    const cost = instance.price_per_hour_usd;
                                    const costColor = getCostColorClass(cost);

                                    return (
                                        <div key={`${instance.providerId}-${instance.instance_type}`} className="flex justify-between items-center p-2 rounded bg-green-900/10">
                                            <div className="flex items-center">
                                                <span className="text-cyan-400 flex items-center">
                                                    {providerIcons[instance.providerId] || null}
                                                </span>
                                                <span className="font-medium text-white">{instance.provider}: {instance.instance_type}</span>
                                                <span className="ml-1 text-xs text-gray-400">
                                                    ({instance.gpu_count}x {instance.gpu_model}, {instance.gpu_memory_gb} GB)
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className={`font-bold ${costColor}`}>
                                                    ${cost.toFixed(2)}
                                                </span>
                                                <span className="text-sm text-gray-300">/ hour</span>
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Show unavailable instances at the bottom if any */}
                                {incompatibleInstances.length > 0 && (
                                    <div className="mt-3 pt-2 border-t border-gray-700">
                                        <p className="text-xs text-gray-400 mb-2">Instances with insufficient memory:</p>
                                        {incompatibleInstances.map((instance) => (
                                            <div key={`${instance.providerId}-${instance.instance_type}`} className="flex justify-between items-center p-2 rounded bg-red-900/10">
                                                <div className="flex items-center">
                                                    <span className="text-gray-500 flex items-center">
                                                        {providerIcons[instance.providerId] || null}
                                                    </span>
                                                    <span className="font-medium text-gray-400">{instance.provider}: {instance.instance_type}</span>
                                                    <span className="ml-1 text-xs text-gray-500">
                                                        ({instance.gpu_count}x {instance.gpu_model}, {instance.gpu_memory_gb} GB)
                                                    </span>
                                                </div>
                                                <div className="text-gray-500 text-sm">
                                                    Insufficient memory
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CloudCost;
