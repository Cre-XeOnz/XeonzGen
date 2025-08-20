export function ModelComparison() {
  const models = [
    {
      name: "Stable Diffusion",
      icon: "fas fa-cogs",
      iconColor: "text-blue-600",
      bgColor: "bg-blue-100",
      description: "Reliable and versatile model for all types of thumbnails. Completely free to use.",
      features: [
        "100% Free",
        "High quality results",
        "Fast generation",
      ],
    },
    {
      name: "Flux",
      icon: "fas fa-palette",
      iconColor: "text-purple-600",
      bgColor: "bg-purple-100",
      description: "Excellent for artistic and creative content with unique aesthetic appeal.",
      features: [
        "Artistic styles",
        "Creative compositions",
        "No API costs",
      ],
    },
    {
      name: "SDXL",
      icon: "fas fa-eye",
      iconColor: "text-green-600",
      bgColor: "bg-green-100",
      description: "High-quality model perfect for detailed and photorealistic thumbnails.",
      features: [
        "High resolution",
        "Photorealistic results",
        "Free access",
      ],
    },
  ];

  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            AI Models We Use
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Each model excels in different areas. Our AI picks the right one for you.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {models.map((model, index) => (
            <div key={index} className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200" data-testid={`model-${index}`}>
              <div className="flex items-center space-x-3 mb-4">
                <div className={`w-10 h-10 ${model.bgColor} rounded-lg flex items-center justify-center`}>
                  <i className={`${model.icon} ${model.iconColor}`}></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">{model.name}</h3>
              </div>
              <p className="text-gray-600 mb-4">{model.description}</p>
              <div className="space-y-2">
                {model.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-center space-x-2">
                    <i className="fas fa-check text-green-500 text-sm"></i>
                    <span className="text-sm text-gray-600">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
