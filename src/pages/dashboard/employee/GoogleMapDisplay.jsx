import { useState, useEffect } from 'react';
import { IconLoader } from '@tabler/icons-react';

// Google Map Location Display Component
const GoogleMapDisplay = ({ url }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Timeout to prevent infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
        setError('Map failed to load. Please check the URL or provide a valid latitude and longitude.');
      }
    }, 10000); // 10 seconds timeout

    return () => clearTimeout(timer);
  }, [isLoading]);

  // If no URL is provided
  if (!url) {
    console.warn('No URL provided for GoogleMapDisplay');
    return (
      <div className="text-gray-500 dark:text-gray-400 text-sm p-4">
        No map location provided.
      </div>
    );
  }

  // Function to extract latitude and longitude from URL
  const getCoordinates = (inputUrl) => {
    try {
      console.log('Processing URL for coordinates:', inputUrl);
      
      // Handle coordinate-based URLs (e.g., /@latitude,longitude,zoomz)
      const coordMatch = inputUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)(?:,\d+z)?/);
      if (coordMatch) {
        const [, lat, lng] = coordMatch;
        console.log('Extracted coordinates:', { lat, lng });
        return { lat, lng };
      }

      // Handle URLs with query param 'q' containing coordinates (e.g., q=40.7128,-74.0060)
      const urlObj = new URL(inputUrl);
      const q = urlObj.searchParams.get('q');
      if (q && q.match(/^(-?\d+\.\d+),(-?\d+\.\d+)$/)) {
        const [lat, lng] = q.split(',');
        console.log('Extracted coordinates from query:', { lat, lng });
        return { lat, lng };
      }

      // Handle short URLs (goo.gl/maps) by checking for coordinates in the path
      if (inputUrl.includes('goo.gl/maps')) {
        // Note: Short URLs may require server-side resolution for accuracy
        console.warn('Short URL detected:', inputUrl);
        const shortMatch = inputUrl.match(/(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (shortMatch) {
          const [, lat, lng] = shortMatch;
          console.log('Extracted coordinates from short URL:', { lat, lng });
          return { lat, lng };
        }
      }

      console.warn('No coordinates found in URL:', inputUrl);
      return null;
    } catch (e) {
      console.error('Error parsing URL for coordinates:', e, 'URL:', inputUrl);
      return null;
    }
  };

  // Generate embed URL using coordinates
  const getEmbedUrl = (inputUrl) => {
    const coords = getCoordinates(inputUrl);
    if (!coords) {
      console.warn('Failed to extract coordinates from URL:', inputUrl);
      return null;
    }

    const { lat, lng } = coords;
    // Validate latitude and longitude
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      console.warn('Invalid coordinates:', { lat, lng });
      return null;
    }

    const embedUrl = `https://www.google.com/maps/embed/v1/view?center=${lat},${lng}&zoom=15`;
    console.log('Generated embed URL:', embedUrl);
    return embedUrl;
  };

  const embedUrl = getEmbedUrl(url);

  if (!embedUrl) {
    console.warn('Failed to generate valid embed URL for:', url);
    return (
      <div className="text-red-500 dark:text-red-400 text-sm p-4">
        Unable to display map. Please provide a Google Maps URL with valid latitude and longitude (e.g., https://www.google.com/maps/@40.7128,-74.0060,15z).
      </div>
    );
  }

  return (
    <div className="relative w-full h-64 md:h-80 lg:h-96 border border-gray-300 rounded-md overflow-hidden dark:border-gray-600">
      {isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <IconLoader className="animate-spin text-blue-600 dark:text-blue-400" size={24} />
        </div>
      )}
      {error ? (
        <div className="text-red-500 dark:text-red-400 text-sm p-4">
          {error}
        </div>
      ) : (
        <iframe
          title={`Google Map for ${url}`}
          src={embedUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          sandbox="allow-scripts allow-same-origin allow-popups"
          onLoad={() => {
            console.log('Iframe loaded successfully:', embedUrl);
            setIsLoading(false);
          }}
          onError={(e) => {
            console.error('Iframe failed to load:', embedUrl, e);
            setIsLoading(false);
            setError('Failed to load map. Please check the URL or try again later.');
          }}
        ></iframe>
      )}
    </div>
  );
};
export default GoogleMapDisplay;