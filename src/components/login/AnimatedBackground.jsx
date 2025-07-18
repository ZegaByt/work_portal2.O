import React, { useMemo } from "react";

// Define the animation keyframes within a string
// This will be injected into a <style> tag.
const getAnimationKeyframes = (roleAccentColor) => `
  @keyframes floatEffect {
    0% {
      transform: translate(0, 0) scale(1) rotate(0deg);
      opacity: 0.05;
    }
    25% {
      transform: translate(5vw, 5vh) scale(1.05) rotate(15deg);
      opacity: 0.1;
    }
    50% {
      transform: translate(0, 10vh) scale(1) rotate(0deg);
      opacity: 0.08;
    }
    75% {
      transform: translate(-5vw, 5vh) scale(0.95) rotate(-15deg);
      opacity: 0.1;
    }
    100% {
      transform: translate(0, 0) scale(1) rotate(0deg);
      opacity: 0.05;
    }
  }

  @keyframes driftX {
    0% { transform: translateX(0); }
    50% { transform: translateX(10vw); }
    100% { transform: translateX(0); }
  }

  @keyframes driftY {
    0% { transform: translateY(0); }
    50% { transform: translateY(10vh); }
    100% { transform: translateY(0); }
  }

  .floating-element {
    animation: floatEffect 18s ease-in-out infinite, driftX var(--drift-duration-x) ease-in-out infinite alternate, driftY var(--drift-duration-y) ease-in-out infinite alternate;
    box-shadow: 0 0 10px ${roleAccentColor}, inset 0 0 5px ${roleAccentColor};
    filter: blur(2px);
  }

  /* Ensure the style tag is reset properly for responsiveness when role changes */
  @media (max-width: 768px) {
    @keyframes floatEffect {
      0% { transform: translate(0, 0) scale(1) rotate(0deg); opacity: 0.03; }
      50% { transform: translate(7vw, 7vh) scale(1.02) rotate(10deg); opacity: 0.06; }
      100% { transform: translate(0, 0) scale(1) rotate(0deg); opacity: 0.03; }
    }
    @keyframes driftX {
      0% { transform: translateX(0); }
      50% { transform: translateX(15vw); } /* More movement on smaller screens */
      100% { transform: translateX(0); }
    }
    @keyframes driftY {
      0% { transform: translateY(0); }
      50% { transform: translateY(15vh); } /* More movement on smaller screens */
      100% { transform: translateY(0); }
    }
    .floating-element {
      animation: floatEffect 25s ease-in-out infinite, driftX var(--drift-duration-x) ease-in-out infinite alternate, driftY var(--drift-duration-y) ease-in-out infinite alternate;
      filter: blur(1px); /* Slightly less blur on smaller elements */
    }
  }
`;

// Helper function to generate random properties for background visual elements
const generateVisualElements = (count, baseSize, minOpacity, maxOpacity) => {
  const elements = [];
  for (let i = 0; i < count; i++) {
    const size = Math.random() * baseSize + (baseSize / 2); // Vary size from baseSize/2 to baseSize*1.5
    const opacity = Math.random() * (maxOpacity - minOpacity) + minOpacity; // Vary opacity within range
    const shape = ['rounded-full', 'rounded-lg', 'transform rotate-45'][Math.floor(Math.random() * 3)]; // Different shapes: circle, square, diamond
    const positionX = Math.random() * 100; // Random horizontal position (0-100%)
    const positionY = Math.random() * 100; // Random vertical position (0-100%)
    const zIndex = Math.floor(Math.random() * 5) + 1; // Random z-index for layering (1-5)
    const animationDelay = Math.random() * 10 + 's'; // Delay for staggering animations
    const animationDurationX = (20 + Math.random() * 30) + 's'; // Vary drift duration
    const animationDurationY = (20 + Math.random() * 30) + 's'; // Vary drift duration

    elements.push({
      size: `${size}px`,
      opacity: opacity,
      shape: shape,
      positionX: `${positionX}%`,
      positionY: `${positionY}%`,
      zIndex: zIndex,
      animationDelay: animationDelay,
      animationDurationX: animationDurationX,
      animationDurationY: animationDurationY,
    });
  }
  return elements;
};

const AnimatedBackground = ({ children, role }) => {
  let gradientFrom = "";
  let gradientTo = "";
  let accentColorForGlow = ""; // Used for subtle glows and shadows on elements
  let particleCount = 0; // Number of background particles/elements

  // Define role-specific properties for colors and particle density
  if (role === "Employee") {
    gradientFrom = "from-blue-800"; // Deep professional blue
    gradientTo = "to-blue-950";
    accentColorForGlow = "rgba(59, 130, 246, 0.2)"; // Blue-500 equivalent with alpha
    particleCount = 65;
  } else if (role === "Admin") {
    gradientFrom = "from-rose-800"; // Deep vibrant rose
    gradientTo = "to-rose-950";
    accentColorForGlow = "rgba(244, 63, 94, 0.2)"; // Rose-500 equivalent with alpha
    particleCount = 75;
  } else if (role === "SuperAdmin") {
    gradientFrom = "from-purple-800"; // Deep regal purple
    gradientTo = "to-purple-950";
    accentColorForGlow = "rgba(168, 85, 247, 0.2)"; // Purple-500 equivalent with alpha
    particleCount = 85;
  } else { // Default or general
    gradientFrom = "from-gray-800";
    gradientTo = "to-gray-950";
    accentColorForGlow = "rgba(107, 114, 128, 0.2)"; // Gray-500 equivalent with alpha
    particleCount = 55;
  }

  // Memoize the generated elements
  const visualElements = useMemo(() => {
    return generateVisualElements(particleCount, 40, 0.03, 0.15);
  }, [role, particleCount]);

  // Inject the dynamic keyframes into the document head
  React.useEffect(() => {
    const styleTag = document.createElement('style');
    styleTag.innerHTML = getAnimationKeyframes(accentColorForGlow);
    styleTag.id = 'animated-background-styles'; // Give it an ID to prevent duplicates
    
    // Remove existing style tag if role changes, to update accent color in keyframes
    const existingStyleTag = document.getElementById('animated-background-styles');
    if (existingStyleTag) {
      existingStyleTag.remove();
    }
    document.head.appendChild(styleTag);

    // Cleanup: remove the style tag when the component unmounts
    return () => {
      const currentStyleTag = document.getElementById('animated-background-styles');
      if (currentStyleTag) {
        currentStyleTag.remove();
      }
    };
  }, [accentColorForGlow]); // Re-inject if accent color changes (i.e., role changes)

  return (
    <div className={`min-h-screen relative overflow-hidden bg-gradient-to-br ${gradientFrom} ${gradientTo}`}>
      {/* Background visual elements for depth and texture */}
      {visualElements.map((el, index) => (
        <div
          key={index}
          className={`absolute ${el.shape} floating-element`}
          style={{
            width: el.size,
            height: el.size,
            top: el.positionY,
            left: el.positionX,
            opacity: el.opacity,
            zIndex: el.zIndex,
            backgroundColor: 'white',
            '--drift-duration-x': el.animationDurationX,
            '--drift-duration-y': el.animationDurationY,
            animationDelay: el.animationDelay,
            
            borderRadius: el.shape === 'rounded-full' ? '50%' : '8px', 

            filter: `blur(${el.zIndex * 0.7}px)`,
            
            transform: `scale(${1 + (el.zIndex * 0.05)})`,
          }}
        />
      ))}
      
      {/* Main content layer: ensures your dashboard/login content is always visible and interactive */}
      {/* Changed flex-row to flex-col for mobile, and flex-row for medium screens and up */}
      <div className="relative z-50 w-full min-h-screen flex flex-col md:flex-row items-center justify-center p-4 sm:p-8">
        {children}
      </div>
    </div>
  );
};

export default AnimatedBackground;