import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface MajorCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  examples: string[];
}

const MajorCard = ({ icon: Icon, title, description, examples }: MajorCardProps) => {
  return (
    <Card className="group hover:shadow-[var(--shadow-glow)] transition-all duration-300 hover:-translate-y-1 border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
          <Icon className="w-6 h-6 text-primary-foreground" />
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription className="text-muted-foreground">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground/80">Popular majors:</p>
          <ul className="space-y-1">
            {examples.map((example, index) => (
              <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                {example}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default MajorCard;
