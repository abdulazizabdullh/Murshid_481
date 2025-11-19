import { useEffect, useState } from 'react';
import { GraduationCap, BookOpen, Award, TrendingUp, Lightbulb, Target, Microscope, Calculator, Palette, Code, Stethoscope, Globe } from 'lucide-react';

export function AnimatedHero() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const icons = [
    { Icon: Microscope, color: 'from-blue-400 to-blue-500', delay: 0, position: 'top-10 left-12 md:left-20' },
    { Icon: Calculator, color: 'from-purple-400 to-purple-500', delay: 0.2, position: 'top-1/3 right-4 md:right-20' },
    { Icon: Palette, color: 'from-pink-400 to-pink-500', delay: 0.4, position: 'bottom-5 left-1/3' },
    { Icon: Code, color: 'from-green-400 to-green-500', delay: 0.6, position: 'bottom-20 right-12' },
    { Icon: Stethoscope, color: 'from-yellow-400 to-yellow-500', delay: 0.8, position: 'top-1/2 left-4 md:left-20' },
    { Icon: Globe, color: 'from-red-400 to-red-500', delay: 1, position: 'top-1/3.5 right-1/3' },
  ];

  return (
    <div className="relative w-full h-[400px] lg:h-[500px]">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-200 dark:bg-blue-400/20 rounded-full opacity-50 blur-3xl animate-[pulse_4s_ease-in-out_infinite]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-200 dark:bg-purple-400/20 rounded-full opacity-50 blur-3xl animate-[pulse_5s_ease-in-out_infinite]"></div>
        <div className="absolute top-1/2 right-1/3 w-72 h-72 bg-pink-200 dark:bg-pink-400/20 rounded-full opacity-50 blur-3xl animate-[pulse_6s_ease-in-out_infinite]"></div>
      </div>

      {/* Floating Icons */}
      {icons.map(({ Icon, color, delay, position }, index) => (
        <div
          key={index}
          className={`absolute ${position} ${mounted ? 'opacity-100' : 'opacity-0'}`}
          style={{
            animation: `float 3s ease-in-out infinite ${delay}s, fadeIn 0.6s ease-out ${delay}s forwards`,
          }}
        >
          <div 
            className={`w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform`}
          >
            <Icon className="w-8 h-8 lg:w-10 lg:h-10 text-white" />
          </div>
        </div>
      ))}

      {/* Central Animated Element */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="relative">
          {/* Rotating Circle */}
          <div className="w-32 h-32 lg:w-40 lg:h-40 border-4 border-blue-400 dark:border-blue-500 rounded-full animate-[spin_8s_linear_infinite] opacity-30"></div>
          
          {/* Inner Circle */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 lg:w-32 lg:h-32 bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 rounded-full shadow-2xl animate-[pulse_3s_ease-in-out_infinite] flex items-center justify-center">
            <GraduationCap className="w-12 h-12 lg:w-16 lg:h-16 text-white" />
          </div>
        </div>
      </div>

      {/* Particles */}
      {[...Array(12)].map((_, i) => (
        <div
          key={`particle-${i}`}
          className="absolute w-2 h-2 bg-blue-400 dark:bg-blue-300 rounded-full opacity-0"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `particle 4s ease-in-out infinite ${i * 0.3}s`,
          }}
        />
      ))}

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(5deg);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes particle {
          0% {
            opacity: 0;
            transform: translateY(0) scale(0);
          }
          50% {
            opacity: 0.6;
            transform: translateY(-30px) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-60px) scale(0);
          }
        }
      `}</style>
    </div>
  );
}
