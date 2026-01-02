import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-white mt-auto border-t">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <img src="/src/assets/tib-logo.png" alt="TIB Logo" className="h-16" />
            <img src="/src/assets/uni-hannover-logo.png" alt="Uni Hannover Logo" className="h-16" />
            <img src="/src/assets/l3s-logo.png" alt="L3S Logo" className="h-16" />
            <img src="/src/assets/infai-logo.png" alt="InfAI Logo" className="h-16" />
          </div>
          <div className="flex items-center gap-4">
            <img src="/src/assets/eu-logo.png" alt="EU Logo" className="h-12" />
            <img src="/src/assets/eosc-logo.png" alt="EOSC Logo" className="h-12" />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;