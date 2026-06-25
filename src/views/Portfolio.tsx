"use client";

import { Mail, Github, Linkedin, ArrowDown } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DotPattern } from '@/components/ui/dot-pattern';
import { Particles } from '@/components/ui/particles';
import { RainbowButton } from '@/components/ui/rainbow-button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/components/auth/useAuth';
import Navigation from '@/components/Navigation';
import ProjectCard from '@/components/ProjectCard';
import { SERVICES } from '@/lib/services';

type Project = {
  title: string;
  description: string;
  technologies: string[];
  liveUrl?: string;
  githubUrl?: string;
};

const PROJECTS: Project[] = [
  {
    title: "PTI - AI Physical Therapy",
    description: "Developed a full-stack AI-powered physical therapy platform, designing and implementing a complete architecture from scratch, including: a modern UI, LLM fine tuning, an API, interactive 3D models, and secure, encrypted authentication.",
    technologies: ["PostgreSQL", "SQLAlchemy", "Mistral AI", "Tailwind CSS", "React", "Next.js", "Python"],
    githubUrl: "https://github.com/kvilleda12/pt",
  },
  {
    title: "ShAI - NBA Statistics Platform",
    description: "Developed a full-stack NBA statistics platform that ingested live NBA data and used machine learning to calculate player ratings, team ratings, and game predictions.",
    technologies: ["Next.js", "FastAPI", "PostgreSQL", "Machine Learning"],
    liveUrl: "https://shaistats.vercel.app/",
    githubUrl: "https://github.com/adamsolimancs/nbai",
  },
  {
    title: "ClareCreated's Website",
    description: "Created, engineered, and deployed a full-stack website for ClareCreated, a popular social media influencer. Implemented responsive design, SEO optimization (96/100 score on GoDaddy), and integrated social media features.",
    technologies: ["React", "Next.js", "Node.js", "TypeScript", "Tailwind CSS"],
    liveUrl: "clarecreated.com",
    githubUrl: "https://github.com/adamsolimancs/clarecreated",
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
    technologies: ["Next.js", "React", "TypeScript", "Tailwind CSS", "Supabase", "shadcn/ui"],
    liveUrl: "adamesoliman.com",
    githubUrl: "https://github.com/adamsolimancs/portfolio",
  },
];

const Portfolio = () => {
  const currentYear = new Date().getFullYear();
  const { loading: authLoading, user } = useAuth();
  const isSignedIn = Boolean(user);
  const customerLabel =
    user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email;

  const scrollToProjects = () => {
    document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToServices = () => {
    document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <Particles
        className="fixed inset-0 z-0 opacity-70"
        quantity={160}
        staticity={35}
        ease={80}
        size={0.8}
        color="#111111"
        vx={0.02}
        vy={-0.02}
        refresh
      />

      <div className="relative z-10">
        <Navigation />

        {/* Hero Section */}
        <section id="hero" className="section-spacing min-h-screen flex items-center">
        <div className="section-container">
          <div className="max-w-4xl">
            <div className="animate-fade-in">
              {/* Profile Section */}
              <div className="flex flex-col lg:flex-row lg:items-start gap-8 mb-10">
                <div className="flex flex-col items-center pt-4 sm:pt-0 pb-0 sm:pb-2">
                  <Avatar className="w-32 h-32 md:w-40 md:h-40 mb-6">
                    <AvatarImage
                      src="/headshot.jpg"
                      alt="Adam Soliman"
                      className="object-cover"
                    />
                    <AvatarFallback className="text-2xl md:text-3xl font-medium">AS</AvatarFallback>
                  </Avatar>
                  <img
                    src="/logo.png"
                    alt="Adam Soliman signature"
                    className="h-14 md:h-18 lg:h-24 w-auto"
                  />
                </div>

                <div className="flex-1 text-center lg:text-left">
                  <h1 className="text-display mb-6 pt-1 md:pt-0">
                    Adam Soliman
                  </h1>
                  <h2 className="text-subheading mb-8 max-w-2xl">
                    Full-Stack Developer & NYU CS Honors
                  </h2>
                  <p className="text-body max-w-xl mb-6">
                    I'm an undergrad computer science student at NYU with a passion for AI research, machine learning, and entrepreneurship.
                  </p>
                  <p className="text-body max-w-xl mb-6">
                    Currently, I have experience in full-stack development and AI, creating user-centric applications that leverage modern technologies.
                    I genuinely enjoy creating unique ways to solve peoples' problems, especially using machine learning.
                  </p>
                  <p className="text-body max-w-xl mb-12">
                    Outside of coding, I enjoy playing basketball, listening to music, and learning Spanish and Arabic.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 mb-16 justify-center items-center w-full lg:pr-32">
                    <RainbowButton onClick={scrollToServices} size="lg">
                      Explore Services
                    </RainbowButton>
                    <Button variant="outline" onClick={scrollToProjects} size="lg">
                      View My Work
                    </Button>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={scrollToServices}
                  className="animate-float hover:text-primary transition-colors"
                  aria-label="Scroll to services"
                >
                  <ArrowDown className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        </div>
        </section>

        {/* Services Section */}
        <section id="services" className="section-spacing relative overflow-hidden">
        <DotPattern
          width={24}
          height={24}
          cx={1.5}
          cy={1.5}
          cr={1.5}
          className="[mask-image:radial-gradient(760px_circle_at_center,white,transparent)] opacity-65"
        />
        <div className="section-container relative z-10">
          <div className="animate-slide-up">
            <h2 className="text-heading mb-4 text-center">Services</h2>
            <p className="text-body mb-12 max-w-2xl text-center mx-auto">
              I design and develop web services for small to medium businesses,
              specifically optimized for SEO, google indexing, and AI discovery.
              <span className="block">
                Contact me at{' '}
                <a href="mailto:aes10130@nyu.edu" className="link-minimal">
                  aes10130 (at) nyu.edu
                </a>
                .
              </span>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {SERVICES.map((service) => (
                <article
                  key={service.title}
                  className="card-minimal p-5 pb-7 pl-7 md:pb-8 md:pl-8 hover:scale-[1.02] hover:-translate-y-2"
                >
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-heading text-xl md:text-2xl mb-2">
                        {service.title}
                      </h3>
                    </div>

                    <ul className="space-y-2.5">
                      {service.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex gap-3 text-sm md:text-base text-muted-foreground"
                        >
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              ))}
            </div>
            <div className="mt-12 text-center">
              <Button className="bg-black text-white hover:bg-black/90" size="lg" asChild>
                <Link href={isSignedIn ? "/dashboard" : "/sign-in"}>
                  {isSignedIn ? "View Dashboard" : authLoading ? "Checking session..." : "Sign in to view dashboard"}
                </Link>
              </Button>
              {isSignedIn && (
                <p className="mt-3 text-sm text-muted-foreground">
                  Signed in{customerLabel ? ` as ${customerLabel}` : ""}.
                </p>
              )}
            </div>
          </div>
        </div>
        </section>

        {/* Projects Section */}
        <section id="projects" className="section-spacing">
        <div className="section-container">
          <div className="animate-slide-up">
            <h2 className="text-heading mb-4 text-center">Projects</h2>
            <p className="text-body mb-16 max-w-2xl text-center mx-auto">
              Here are some of my recent projects that showcase my skills in
              full-stack development, design, and problem-solving.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {PROJECTS.map((project, index) => (
                <ProjectCard
                  key={project.title}
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
              <h2 className="text-heading mb-4 text-center">Contact Me</h2>
              <div className="gap-16 items-center justify-center">
                {/* Contact Info */}
                <div className="space-y-6 flex flex-col items-center">
                  <div>
                    <p className="text-body mb-4 text-center">
                      Feel free to reach out through any of these channels, I typically respond within 24 hours.
                    </p>
                  </div>

                  <div className="flex flex-col gap-4 items-start">
                    <p
                      className="flex items-center gap-3 text-primary"
                    >
                      <Mail className="w-5 h-5" />
                      aes10130 at nyu.edu
                    </p>
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
        </section>

        {/* Footer */}
        <footer className="border-t border-border py-8">
        <div className="section-container">
          <div className="text-center">
            <p className="text-caption">
              © {currentYear} Adam Soliman.
            </p>
          </div>
        </div>
        </footer>
      </div>
    </div>
  );
};

export default Portfolio;
