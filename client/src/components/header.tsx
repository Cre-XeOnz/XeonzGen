import { Link } from "wouter";

export function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-slate-200">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2" data-testid="link-home">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-main to-blue-main rounded-lg flex items-center justify-center">
              <i className="fas fa-image text-white text-sm"></i>
            </div>
            <span className="text-xl font-bold text-gray-900">Xeonz Image Gen</span>
          </Link>
          
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-600 hover:text-gray-900 font-medium transition-colors" data-testid="link-features">
              Features
            </a>
            <a 
              href="#gallery" 
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors" 
              data-testid="link-gallery"
              onClick={(e) => {
                e.preventDefault();
                const galleryElement = document.getElementById('gallery');
                if (galleryElement) {
                  galleryElement.scrollIntoView({ behavior: 'smooth' });
                  // Trigger gallery view if image generator is present
                  const galleryButton = document.querySelector('[data-testid="button-gallery"]') as HTMLButtonElement;
                  if (galleryButton) {
                    galleryButton.click();
                  }
                }
              }}
            >
              Gallery
            </a>
          </div>
          
          <button className="md:hidden" data-testid="button-menu">
            <i className="fas fa-bars text-gray-600 text-xl"></i>
          </button>
        </div>
      </nav>
    </header>
  );
}
