export function FeaturesSection() {
  const features = [
    {
      icon: "fas fa-brain",
      title: "High-Quality Generation",
      description: "Generate 5 stunning images at once with our advanced AI models optimized for quality and accuracy.",
      gradient: "from-purple-main to-blue-main",
    },
    {
      icon: "fas fa-bolt",
      title: "Lightning Fast",
      description: "Get professional images in under 30 seconds with our optimized generation pipeline.",
      gradient: "from-emerald-main to-blue-main",
    },
    {
      icon: "fas fa-gift",
      title: "Completely Free",
      description: "Unlimited free generations with no watermarks, accounts, or hidden fees. Start creating immediately.",
      gradient: "from-purple-main to-emerald-main",
    },
  ];

  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Why Choose Xeonz Image Gen?
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Experience the power of AI-driven image creation with our cutting-edge platform
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="text-center" data-testid={`feature-${index}`}>
              <div className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center mx-auto mb-6`}>
                <i className={`${feature.icon} text-white text-2xl`}></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
