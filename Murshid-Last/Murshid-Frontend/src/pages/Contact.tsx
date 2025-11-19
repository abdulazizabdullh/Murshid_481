import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { Card } from '@/components/ui/card';
import { PageAnimation } from "@/components/animations/PageAnimation";
import { ScrollAnimation } from "@/components/animations/ScrollAnimation";
import { Mail, Phone, MapPin, Github, Linkedin, Star, Heart, Sparkles } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';

const teamMembers = [
  {
    id: 1,
    name: 'Hamza Hamdi',
    role: 'Scrum Master & Back end Developer',
    image: '/Hamza.jpg',
    email: 'hamza.hamdi5@gmail.com',
    github: 'https://github.com/hamza808111 ',
    linkedin: 'https://www.linkedin.com/in/hamza-hamdi-48b316157?utm_source=share_via&utm_content=profile&utm_medium=member_android',
    color: 'from-blue-400 to-purple-600'
  },
  {
    id: 2,
    name: 'Mohammed Albilaly',
    role: 'Software Tester & Full-Stack Developer',
    image: '/bilali.jpg',
    email: 'm.ay.albilaly@gmail.com',
    github: 'https://github.com/MAB-SWE',
    linkedin: 'https://www.linkedin.com/in/mohammed-albilaly-9867ab271/',
    color: 'from-pink-400 to-red-600'
  },
  {
    id: 3,
    name: 'Abdulaziz Alamro',
    role: 'Product Owner & Backend Developer',
    image: '/aziz.jpg',
    email: 'aasaabd1998@gmail.com',
    github: 'https://github.com/abdulazizabdullh',
    linkedin: 'https://www.linkedin.com/in/abdulaziz-alamro-015552273?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app',
    color: 'from-green-400 to-teal-600'
  },
  {
    id: 4,
    name: 'Abderraouf bendjedia',
    role: 'UI/UX Designer & Frontend Developer',
    image: '/raouf.jpg',
    email: 'Abderraoufbendjedia@gmail.com',
    github: 'https://github.com/Abderraouf17',
    linkedin: 'https://www.linkedin.com/in/abderraouf-bendjedia-885b5422b/',
    color: 'from-yellow-400 to-orange-600'
  },
  {
    id: 5,
    name: 'Muhannad Aldawsari',
    role: 'Software Tester & Frontend Developer',
    image: '/hnd.jpg',
    email: 'muhanad1214@hotmail.com',
    github: 'https://github.com/MuhannadAldawsari',
    linkedin: 'https://www.linkedin.com/in/muhannad-aldawsari-0a065a383?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app',
    color: 'from-indigo-400 to-blue-600'
  },
  {
    id: 6,
    name: 'Basel Alzahrani',
    role: 'Full-Stack Developer',
    image: '/basil.jpg',
    email: 'layla@team3n3.com',
    github: 'https://github.com/layla',
    linkedin: 'https://linkedin.com/in/layla',
    color: 'from-purple-400 to-pink-600'
  }
];

export default function Contact() {
  const { language } = useI18n();
  const [hoveredMember, setHoveredMember] = useState<number | null>(null);

  return (
    <PageAnimation>
      <div className="min-h-screen bg-gradient-to-br from-[#e3e8ff] via-[#f5f7ff] to-[#cbd4ff] dark:from-[#0f172a] dark:via-[#1e2a4a] dark:to-[#2a3b6b] overflow-hidden">
        <Navbar />
        
        {/* Floating Elements */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 animate-bounce">
            <Star className="w-6 h-6 text-yellow-400 animate-pulse" />
          </div>
          <div className="absolute top-40 right-20 animate-bounce delay-1000">
            <Heart className="w-8 h-8 text-pink-400 animate-pulse" />
          </div>
          <div className="absolute bottom-40 left-20 animate-bounce delay-2000">
            <Sparkles className="w-7 h-7 text-purple-400 animate-pulse" />
          </div>
          <div className="absolute top-60 right-10 animate-bounce delay-500">
            <Star className="w-5 h-5 text-blue-400 animate-pulse" />
          </div>
        </div>

        <div className="py-20">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10">
            
            {/* Header Section */}
            <ScrollAnimation>
              <div className="text-center mb-20">
                <div className="inline-block mb-8 animate-pulse">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-4 rounded-full text-2xl font-bold shadow-2xl transform hover:scale-110 transition-all duration-500">
                    Team 3N3
                  </div>
                </div>
                
                <h1 className="text-4xl md:text-8xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400 animate-pulse" dir={language}>
                  {language === 'ar' ? 'تواصل معنا' : 'Contact Us'}
                </h1>
                
                <p className="text-2xl text-gray-700 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed animate-fade-in" dir={language}>
                  {language === 'ar' 
                    ? 'مشروع مرشد - دليلك الأكاديمي الذكي، تم تطويره بواسطة فريق 3N3 المتميز'
                    : 'Murshid Project - Your Smart Academic Guide, Developed by the Amazing Team 3N3'}
                </p>
              </div>
            </ScrollAnimation>

            {/* Team Members Grid */}
            <ScrollAnimation delay={0.3}>
              <div className="mb-20">
                <h2 className="text-4xl font-bold text-center mb-16 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400 text-transparent animate-pulse" dir={language}>
                  {language === 'ar' ? 'فريق العمل المتميز' : 'Our Amazing Team'}
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {teamMembers.map((member, index) => (
                    <ScrollAnimation key={member.id} delay={index * 0.2}>
                      <Card 
                        className="relative p-8 rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-700 transform hover:-translate-y-8 hover:rotate-2 bg-white dark:bg-gray-800 border-0 overflow-hidden group cursor-pointer"
                        onMouseEnter={() => setHoveredMember(member.id)}
                        onMouseLeave={() => setHoveredMember(null)}
                      >
                        {/* Animated Background */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${member.color} opacity-0 group-hover:opacity-20 transition-all duration-700 transform scale-0 group-hover:scale-150 rounded-full`}></div>
                        
                        {/* Floating Particles */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-1000">
                          <div className="absolute top-4 left-4 w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
                          <div className="absolute top-8 right-6 w-1 h-1 bg-pink-400 rounded-full animate-pulse delay-300"></div>
                          <div className="absolute bottom-6 left-8 w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-500"></div>
                          <div className="absolute bottom-4 right-4 w-1 h-1 bg-purple-400 rounded-full animate-ping delay-700"></div>
                        </div>

                        {/* Member Image */}
                        <div className="relative mb-6 mx-auto w-32 h-32 group-hover:w-40 group-hover:h-40 transition-all duration-700">
                          <div className={`absolute inset-0 bg-gradient-to-br ${member.color} rounded-full animate-spin-slow group-hover:animate-pulse`}></div>
                          <div className="absolute inset-2 bg-white dark:bg-gray-800 rounded-full overflow-hidden transform group-hover:scale-110 transition-all duration-700">
                            <img 
                              src={member.image} 
                              alt={member.name}
                              className="w-full h-full object-cover transform group-hover:scale-125 transition-all duration-700"
                            />
                          </div>
                          
                          {/* Role Overlay */}
                          <div className={`absolute inset-0 bg-black bg-opacity-80 rounded-full flex items-center justify-center transition-all duration-500 ${
                            hoveredMember === member.id ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
                          }`}>
                            <p className="text-white text-center text-xs font-semibold px-3 leading-tight max-w-full" style={{whiteSpace: 'pre-line'}}>
                              {member.role.replace(' & ', ' &\n').replace(' and ', ' and\n').replace('Full-Stack Developer & ', 'Full-Stack\n').replace('Frontend Developer & ', 'Frontend\n')}
                            </p>
                          </div>
                        </div>

                        {/* Member Info */}
                        <div className="text-center relative z-10">
                          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 transform group-hover:scale-110 transition-all duration-500">
                            {member.name}
                          </h3>
                          
                          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 min-h-[2.5rem] flex items-center justify-center w-full max-w-[200px] mx-auto" style={{whiteSpace: 'pre-line'}}>
                            {member.role.replace(' & ', ' &\n').replace(' and ', ' and\n')}
                          </p>

                          {/* Social Links */}
                          <div className="flex justify-center gap-4 transform group-hover:scale-125 transition-all duration-700">
                            <a 
                              href={member.github}
                              className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-800 hover:text-white transition-all duration-300 transform hover:rotate-12 hover:scale-125"
                            >
                              <Github className="w-5 h-5" />
                            </a>
                            <a 
                              href={member.linkedin}
                              className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full hover:bg-blue-600 hover:text-white transition-all duration-300 transform hover:-rotate-12 hover:scale-125"
                            >
                              <Linkedin className="w-5 h-5" />
                            </a>
                            <a 
                              href={`mailto:${member.email}`}
                              className="p-2 bg-green-100 dark:bg-green-900 rounded-full hover:bg-green-600 hover:text-white transition-all duration-300 transform hover:rotate-12 hover:scale-125"
                            >
                              <Mail className="w-5 h-5" />
                            </a>
                          </div>
                        </div>

                        {/* Animated Border */}
                        <div className="absolute inset-0 rounded-3xl border-4 border-transparent group-hover:border-gradient-to-r group-hover:from-blue-400 group-hover:to-purple-600 transition-all duration-700"></div>
                      </Card>
                    </ScrollAnimation>
                  ))}
                </div>
              </div>
            </ScrollAnimation>

            {/* Contact Information */}
            <ScrollAnimation delay={0.6}>
              <div className="text-center">
                <Card className="max-w-4xl mx-auto p-12 rounded-3xl shadow-2xl bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-900 border-0 transform hover:scale-105 transition-all duration-700">
                  <h2 className="text-4xl font-bold mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent animate-pulse" dir={language}>
                    {language === 'ar' ? 'معلومات التواصل' : 'Get In Touch'}
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="text-center transform hover:scale-110 hover:rotate-3 transition-all duration-500">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                        <Mail className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">Email</h3>
                      <p className="text-gray-600 dark:text-gray-400">team3n3@gmail.com</p>
                    </div>
                    
                    <div className="text-center transform hover:scale-110 hover:-rotate-3 transition-all duration-500">
                      <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce delay-300">
                        <Phone className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">Phone</h3>
                      <p className="text-gray-600 dark:text-gray-400">+966 508550448</p>
                    </div>
                    
                    <div className="text-center transform hover:scale-110 hover:rotate-3 transition-all duration-500">
                      <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce delay-500">
                        <MapPin className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">Location</h3>
                      <p className="text-gray-600 dark:text-gray-400">Riyadh, Saudi Arabia</p>
                    </div>
                  </div>
                </Card>
              </div>
            </ScrollAnimation>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 2s ease-out;
        }
      `}</style>
    </PageAnimation>
  );
}
