export function HeroSection() {
  return (
    <section className="py-12 lg:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="mb-8">
          <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
            Create Stunning{" "}
            <span className="bg-gradient-to-r from-purple-main to-blue-main bg-clip-text text-transparent">
              AI Images
            </span>{" "}
            in Seconds
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Our smart AI generates professional images instantly with multiple free models. 
            Completely free with unlimited generations and no API costs.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-8 mb-12">
          <div className="flex items-center space-x-2">
            <i className="fas fa-bolt text-emerald-main"></i>
            <span className="text-gray-600">
              <span className="font-semibold text-gray-900">50,000+</span> images generated
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <i className="fas fa-clock text-emerald-main"></i>
            <span className="text-gray-600">
              <span className="font-semibold text-gray-900">&lt; 30s</span> average generation time
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <i className="fas fa-star text-emerald-main"></i>
            <span className="text-gray-600">
              <span className="font-semibold text-gray-900">4.9/5</span> user rating
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
