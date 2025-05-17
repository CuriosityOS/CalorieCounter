'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useUser } from '@/hooks/useUser';
import { ChevronRight, Camera, Scale, BookOpen, Github, LineChart, Utensils, Sparkles } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { user } = useUser();
  const [isScrolled, setIsScrolled] = useState(false);

  // Check for scroll position to change navbar styling
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // If user is logged in, redirect to dashboard, but only once on initial render
  useEffect(() => {
    // Create a ref to track if we've redirected already
    const hasRedirected = localStorage.getItem('landing_redirect_performed');
    
    if (user && !hasRedirected) {
      localStorage.setItem('landing_redirect_performed', 'true');
      router.push('/dashboard');
    }
    
    // Clear the redirect flag when user is not logged in
    if (!user && hasRedirected) {
      localStorage.removeItem('landing_redirect_performed');
    }
    
    // Cleanup function to prevent redirect loops
    return () => {
      if (user) {
        localStorage.setItem('landing_redirect_performed', 'true');
      }
    };
  }, [user, router]);

  // Prefetch routes for faster navigation
  useEffect(() => {
    router?.prefetch('/login');
    router?.prefetch('/signup');
    router?.prefetch('/dashboard');
  }, [router]);

  // Features section data
  const features = [
    {
      title: "AI Image Analysis",
      description: "Snap a photo of your meal and let our AI calculate calories and macros instantly",
      icon: <Camera className="h-10 w-10 text-primary block" />,
      delay: 0.2
    },
    {
      title: "Comprehensive Tracking",
      description: "Monitor your daily intake with detailed breakdowns of calories, protein, carbs, and fat",
      icon: <Utensils className="h-10 w-10 text-primary block" />,
      delay: 0.4
    },
    {
      title: "Custom Nutrition Goals",
      description: "Set personalized targets based on your weight, height, activity level, and fitness goals",
      icon: <Scale className="h-10 w-10 text-primary block" />,
      delay: 0.6
    },
    {
      title: "Detailed Analytics",
      description: "Track your progress with intuitive charts and comprehensive meal history",
      icon: <LineChart className="h-10 w-10 text-primary block" />,
      delay: 0.8
    }
  ];

  return (
    <>
      {/* Gradient Navbar */}
      <div 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
          isScrolled ? 'bg-background/80 backdrop-blur-md shadow-md' : 'bg-transparent'
        }`}
      >
        <div className="container max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <Image 
                src="/logo.png" 
                alt="CalorieCounter Logo" 
                width={50} 
                height={50} 
                className="h-10 w-auto" 
              />
              <span className="text-xl font-bold">CalorieCounter</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-sm font-medium hover:text-primary transition-colors">
                Features
              </Link>
              <Link href="#how-it-works" className="text-sm font-medium hover:text-primary transition-colors">
                How it Works
              </Link>
              <Link href="#about" className="text-sm font-medium hover:text-primary transition-colors">
                About
              </Link>
              {user ? (
                <div className="flex items-center space-x-4">
                  <Link href="/dashboard">
                    <Button variant="ghost" size="sm">Dashboard</Button>
                  </Link>
                </div>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="outline" size="sm" className="ml-2">Log in</Button>
                  </Link>
                  <Link href="/signup">
                    <Button size="sm">Sign up</Button>
                  </Link>
                </>
              )}
            </div>
            
            <div className="flex md:hidden">
              {user ? (
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm">Dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="outline" size="sm" className="mr-2">Log in</Button>
                  </Link>
                  <Link href="/signup">
                    <Button size="sm">Sign up</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="pt-32 pb-24 overflow-hidden">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <div className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-primary/10 text-primary">
                <Sparkles className="mr-1 h-3.5 w-3.5" />
                <span>AI-Powered Nutrition Tracking</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
                Track Your Meals <br />
                <span className="text-primary">Smarter, Not Harder</span>
              </h1>
              
              <p className="text-lg text-muted-foreground max-w-lg">
                Upload food photos and get instant nutrition information. CalorieCounter uses AI to analyze your meals and help you reach your health goals.
              </p>
              
              <div className="flex pt-4">
                <Link href="/signup">
                  <Button size="lg" className="w-full">
                    Get Started
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-purple-600 rounded-2xl blur-xl opacity-50 animate-pulse"></div>
              <div className="relative bg-card rounded-xl border shadow-xl overflow-hidden">
                <Image
                  src="/Classic-Chicken-Salad-4.jpg"
                  alt="Delicious Chicken Salad"
                  width={600}
                  height={400}
                  className="w-full h-auto object-cover"
                  style={{ maxHeight: "400px" }}
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent"></div>
                <div className="absolute bottom-6 left-6 right-6">
                  <Card className="bg-background/80 backdrop-blur-md border-0">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        <div className="bg-primary/20 rounded-full p-3">
                          <Camera className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium">Classic Chicken Salad</h3>
                          <p className="text-sm text-muted-foreground">320 calories • 28g protein • 12g carbs • 18g fat</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/50">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-bold"
            >
              Powerful Features
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="mt-4 text-xl text-muted-foreground max-w-2xl mx-auto"
            >
              Everything you need to track your nutrition with ease
            </motion.p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: feature.delay }}
                viewport={{ once: true }}
                className="bg-card border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="bg-primary/10 rounded-xl p-4 inline-block mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* How It Works Section */}
      <section id="how-it-works" className="py-20">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-bold"
            >
              How It Works
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="mt-4 text-xl text-muted-foreground max-w-2xl mx-auto"
            >
              Three simple steps to start tracking your nutrition
            </motion.p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Take a Photo",
                description: "Snap a picture of your meal or describe it in text",
                icon: <Camera className="h-8 w-8 text-primary" />,
                delay: 0.2
              },
              {
                step: "02",
                title: "AI Analysis",
                description: "Our AI instantly calculates calories and macronutrients",
                icon: <Sparkles className="h-8 w-8 text-primary" />,
                delay: 0.4
              },
              {
                step: "03",
                title: "Track Progress",
                description: "Save meals and monitor your nutrition journey over time",
                icon: <LineChart className="h-8 w-8 text-primary" />,
                delay: 0.6
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: step.delay }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="relative z-10 pt-2">
                  <div className="flex items-center mb-4">
                    <div className="bg-primary/10 rounded-full p-3 mr-3">
                      {step.icon}
                    </div>
                    <h3 className="text-xl font-bold">{step.title}</h3>
                  </div>
                  <p className="text-muted-foreground ml-14">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-primary/5">
        <div className="container max-w-7xl mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-primary/80 to-purple-600/80 rounded-2xl p-8 md:p-12 shadow-xl text-white text-center"
          >
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Transform Your Nutrition Journey?</h2>
              <p className="text-lg mb-8 text-white/90">
                Join thousands of users who have simplified their meal tracking with CalorieCounter.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/signup">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto bg-white hover:bg-white/90 text-primary border-0">
                    Create Free Account
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="ghost" className="w-full sm:w-auto text-white hover:bg-white/20 border border-white/20">
                    Log In
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-12 bg-muted/30">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <Image 
                  src="/logo.png" 
                  alt="CalorieCounter Logo" 
                  width={45} 
                  height={45} 
                  className="h-9 w-auto" 
                />
                <span className="text-xl font-bold">CalorieCounter</span>
              </div>
              <p className="text-muted-foreground mb-4 max-w-md">
                AI-powered calorie tracking app that analyzes food images and provides nutritional information.
              </p>
              <div className="flex space-x-4">
                <a href="https://github.com/CuriosityOS/CalorieCounter" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  <Github className="h-5 w-5" />
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Features</h3>
              <ul className="space-y-2">
                <li><Link href="#features" className="text-muted-foreground hover:text-primary transition-colors">AI Image Analysis</Link></li>
                <li><Link href="#features" className="text-muted-foreground hover:text-primary transition-colors">Meal Tracking</Link></li>
                <li><Link href="#features" className="text-muted-foreground hover:text-primary transition-colors">Custom Goals</Link></li>
                <li><Link href="#features" className="text-muted-foreground hover:text-primary transition-colors">Nutrition Analysis</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Nutrition Guide</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">API Documentation</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Help Center</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border mt-12 pt-8 text-center text-muted-foreground">
            <p>© {new Date().getFullYear()} CalorieCounter. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  );
}