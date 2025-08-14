import { Mail, Github, Linkedin, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import Navigation from '@/components/Navigation';
import ProjectCard from '@/components/ProjectCard';
import ContactForm from '@/components/ContactForm';

const Portfolio = () => {

  const projects = [
    {
      title: "PTI - AI Physical Therapy",
      description: "Developed a full-stack AI-powered physical therapy platform, designing and implementing a complete architecture from scratch, including: a modern UI, LLM fine tuning, an API, interactive 3D models, and secure, encrypted authentication.",
      technologies: ["PostgreSQL", "SQLAlchemy", "Mistral AI", "Tailwind CSS", "React", "Next.js", "Python"],
      githubUrl: "https://github.com/kvilleda12/pt",
    },
    {
      title: "Inhale",
      description: "Developed a cross-platform mobile app (iOS, Android) with a team at HackNYU, focusing on mindfulness and aiding mental illness. Built key app features (breathing customization, daily streaks, haptic feedback) and frontend components.",
      technologies: ["JavaScript", "React-Native", "Expo", "Node.js"],
      githubUrl: "https://github.com/adamsolimancs/Inhale-Breathing-App",
    },
    {
      title: "Portfolio Website",
      description: "A minimalist portfolio website showcasing clean design principles and smooth animations. Built with modern web technologies and AI tools.",
      technologies: ["React", "Vite", "TypeScript", "Lovable.dev", "Tailwind CSS"],
      liveUrl: "adamesoliman.com",
      githubUrl: "https://github.com/adamsolimancs/portfolio",
    },
  ];

  const scrollToProjects = () => {
    const element = document.getElementById('projects');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section id="hero" className="section-spacing min-h-screen flex items-center">
        <div className="section-container">
          <div className="max-w-4xl">
            <div className="animate-fade-in">
              {/* Profile Section */}
              <div className="flex flex-col lg:flex-row lg:items-start gap-8 mb-12">
                <div className="flex flex-col items-center lg:items-start">
                  <Avatar className="w-32 h-32 md:w-40 md:h-40 mb-6">
                    <AvatarImage 
                      src="/placeholder.svg" 
                      alt="Adam Soliman" 
                      className="object-cover"
                    />
                    <AvatarFallback className="text-2xl md:text-3xl font-medium">AS</AvatarFallback>
                  </Avatar>
                  <div className="signature-placeholder text-center lg:text-left">
                    <img 
                      src="/placeholder.svg" 
                      alt="Adam Soliman signature" 
                      className="h-8 md:h-10 w-auto mx-auto lg:mx-0"
                    />
                  </div>
                </div>
                
                <div className="flex-1 text-center lg:text-left">
                  <h1 className="text-display mb-6 pt-8 md:pt-0">
                    Adam Soliman
                  </h1>
                  <h2 className="text-subheading mb-8 max-w-2xl">
                    Full-Stack Software & AI Developer
                  </h2>
                  <p className="text-body max-w-xl mb-6">
                    I'm a Computer Science student at NYU with a passion for AI, machine learning, and entrepreneurship.
                  </p>
                  <p className="text-body max-w-xl mb-12">
                    I create beautiful, functional, and user-centered digital experiences, combining clean code with elegant design. 
                    With a focus on thoughtful development and attention to detail, I bring ideas to life that merge innovation with usability.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 mb-16">
                    <Button onClick={scrollToProjects} size="lg">
                      View My Work
                    </Button>
                    <Button variant="outline" size="lg" asChild>
                      <a href="#contact">Get In Touch</a>
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <button
                  onClick={scrollToProjects}
                  className="animate-float hover:text-primary transition-colors"
                  aria-label="Scroll to projects"
                >
                  <ArrowDown className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="section-spacing">
        <div className="section-container">
          <div className="animate-slide-up">
            <h2 className="text-heading mb-4">Projects</h2>
            <p className="text-body mb-16 max-w-2xl">
              Here are some of my recent projects that showcase my skills in 
              frontend development, design, and problem-solving.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {projects.map((project, index) => (
                <ProjectCard
                  key={index}
                  {...project}
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="section-spacing">
        <div className="section-container">
          <div className="max-w-4xl mx-auto">
            <div className="animate-slide-up">
              <h2 className="text-heading mb-4 text-center">Let's Work Together</h2>
              <p className="text-body mb-16 text-center max-w-2xl mx-auto">
                I'm always interested in new opportunities and exciting projects. 
                Whether you have a question or just want to say hello, feel free to reach out.
              </p>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                {/* Contact Form */}
                <div>
                  <h3 className="text-xl font-medium mb-6">Send a Message</h3>
                  <ContactForm />
                </div>
                
                {/* Contact Info */}
                <div>
                  <h3 className="text-xl font-medium mb-6">Connect With Me</h3>
                  <div className="space-y-6">
                    <div>
                      <p className="text-body mb-4">
                        Feel free to reach out through any of these channels. 
                        I typically respond within 24 hours.
                      </p>
                    </div>
                    
                    <div className="flex flex-col gap-4">
                      <a
                        href="mailto:adamesoliman@gmail.com"
                        className="flex items-center gap-3 text-primary hover:text-primary/80 transition-colors"
                      >
                        <Mail className="w-5 h-5" />
                        adamesoliman@gmail.com
                      </a>
                      <a
                        href="https://github.com/adamsolimancs/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-primary hover:text-primary/80 transition-colors"
                      >
                        <Github className="w-5 h-5" />
                        GitHub
                      </a>
                      <a
                        href="https://www.linkedin.com/in/adam-soliman-71256b291/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-primary hover:text-primary/80 transition-colors"
                      >
                        <Linkedin className="w-5 h-5" />
                        LinkedIn
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="section-container">
          <div className="text-center">
            <p className="text-caption">
              © 2025 Adam Soliman.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Portfolio;