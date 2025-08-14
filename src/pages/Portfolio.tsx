import { Mail, Github, Linkedin, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/Navigation';
import ProjectCard from '@/components/ProjectCard';
import ContactForm from '@/components/ContactForm';

const Portfolio = () => {
  // Placeholder project data - easily customizable
  const projects = [
    {
      title: "E-commerce Platform",
      description: "A modern, responsive e-commerce platform built with React and Node.js. Features include user authentication, payment processing, and admin dashboard.",
      technologies: ["React", "Node.js", "MongoDB", "Stripe"],
      liveUrl: "https://example.com",
      githubUrl: "https://github.com/example",
    },
    {
      title: "Task Management App",
      description: "A collaborative task management application with real-time updates, team collaboration features, and intuitive drag-and-drop interface.",
      technologies: ["Vue.js", "Firebase", "Tailwind CSS"],
      liveUrl: "https://example.com",
      githubUrl: "https://github.com/example",
    },
    {
      title: "Portfolio Website",
      description: "A minimalist portfolio website showcasing clean design principles and smooth animations. Built with modern web technologies.",
      technologies: ["React", "TypeScript", "Framer Motion"],
      liveUrl: "https://example.com",
      githubUrl: "https://github.com/example",
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
              <h1 className="text-display mb-6">
                Alex Johnson
              </h1>
              <h2 className="text-subheading mb-8 max-w-2xl">
                Frontend Developer & UI/UX Designer
              </h2>
              <p className="text-body max-w-xl mb-12">
                I create beautiful, functional, and user-centered digital experiences. 
                With a passion for clean code and elegant design, I bring ideas to life 
                through thoughtful development and attention to detail.
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
            
            <button
              onClick={scrollToProjects}
              className="animate-float hover:text-primary transition-colors"
              aria-label="Scroll to projects"
            >
              <ArrowDown className="w-6 h-6" />
            </button>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="section-spacing">
        <div className="section-container">
          <div className="animate-slide-up">
            <h2 className="text-heading mb-4">Selected Projects</h2>
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
                        href="mailto:alex@example.com"
                        className="flex items-center gap-3 text-primary hover:text-primary/80 transition-colors"
                      >
                        <Mail className="w-5 h-5" />
                        alex@example.com
                      </a>
                      <a
                        href="https://github.com/alexjohnson"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-primary hover:text-primary/80 transition-colors"
                      >
                        <Github className="w-5 h-5" />
                        github.com/alexjohnson
                      </a>
                      <a
                        href="https://linkedin.com/in/alexjohnson"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-primary hover:text-primary/80 transition-colors"
                      >
                        <Linkedin className="w-5 h-5" />
                        linkedin.com/in/alexjohnson
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
              © 2024 Alex Johnson. Built with love and attention to detail.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Portfolio;