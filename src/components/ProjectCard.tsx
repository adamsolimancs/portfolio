import { ExternalLink, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProjectCardProps {
  title: string;
  description: string;
  image?: string;
  liveUrl?: string;
  githubUrl?: string;
  technologies: string[];
  className?: string;
  style?: React.CSSProperties;
}

const ProjectCard = ({
  title,
  description,
  image,
  liveUrl,
  githubUrl,
  technologies,
  className = "",
  style
}: ProjectCardProps) => {
  return (
    <div className={`card-minimal group ${className}`} style={style}>
      {image && (
        <div className="aspect-video bg-muted rounded-md mb-4 overflow-hidden">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      )}
      
      <div className="space-y-3">
        <h3 className="text-heading text-xl">{title}</h3>
        <p className="text-body text-sm">{description}</p>
        
        <div className="flex flex-wrap gap-2">
          {technologies.map((tech) => (
            <span
              key={tech}
              className="text-caption px-2 py-1 bg-accent rounded-md"
            >
              {tech}
            </span>
          ))}
        </div>
        
        <div className="flex gap-3 pt-2">
          {liveUrl && (
            <Button variant="outline" size="sm" asChild>
              <a
                href={liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <ExternalLink className="w-3 h-3" />
                Live Demo
              </a>
            </Button>
          )}
          {githubUrl && (
            <Button variant="ghost" size="sm" asChild>
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <Github className="w-3 h-3" />
                Code
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;