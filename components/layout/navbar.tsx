"use client"

import * as React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search, Menu, User, Shuffle, Globe, MonitorPlay, ChevronDown, ChevronUp, Smartphone, Star, Moon, MessageSquare } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ModeToggle } from "@/components/theme/theme-toggle-button"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"

type NavLink = {
  title: string;
  href: string;
  dropdown?: { title: string; href: string; action?: boolean }[];
};

const navLinks: NavLink[] = [
  { 
    title: "Pics", 
    href: "/pics/popular",
    dropdown: [
      { title: "Most Popular", href: "/pics/popular" },
      { title: "Most Recent", href: "/pics/recent" },
      { title: "Top Rated", href: "/pics/rating" },
      { title: "Most Liked", href: "/pics/likes" },
      { title: "Most Viewed", href: "/pics/views" },
      { title: "Most Commented", href: "/pics/comments" },
    ]
  },
  { 
    title: "Categories", 
    href: "/categories",
    dropdown: [
      { title: "Indian", href: "/tag/indian" },
      { title: "Teen", href: "/tag/teen" },
      { title: "MILF", href: "/tag/milf" },
      { title: "Japanese", href: "/tag/japanese" },
      { title: "Asian", href: "/tag/asian" },
      { title: "Mom", href: "/tag/mom" },
      { title: "Pussy Licking", href: "/tag/pussy-licking" },
      { title: "Pussy", href: "/tag/pussy" },
      { title: "Russian", href: "/tag/russian" },
      { title: "Blowjob", href: "/tag/blowjob" },
      { title: "View All", href: "/tags", action: true },
    ]
  },
  { title: "Tags", href: "/tags" },
  { title: "Pornstars", href: "/pornstars" },
  { title: "Creators", href: "/creators" },
  { title: "Channels", href: "/channels" },
  { title: "Videos", href: "/explore/videos" },
  { title: "Trending", href: "/trending" },
]

export function Navbar() {
  const [openAccordion, setOpenAccordion] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const router = useRouter()

  const toggleAccordion = (title: string) => {
    setOpenAccordion(openAccordion === title ? null : title)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = searchQuery.trim()
    if (q) {
      router.push(`/search?q=${encodeURIComponent(q)}`)
      setSearchQuery("")
      setMobileSearchOpen(false)
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Top Tier - Main Navigation */}
      <div className="container mx-auto flex h-16 max-w-[1600px] items-center px-4 md:px-6">
        {/* Mobile Menu & Logo */}
        <div className="flex items-center gap-2 md:gap-4 md:w-1/4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px] p-0 flex flex-col bg-popover overflow-hidden border-r">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              
              <div className="p-4 flex flex-col gap-3 border-b border-border/50">
                <div className="flex gap-2 w-full">
                  <Button variant="outline" className="flex-1 bg-transparent hover:bg-muted text-foreground border-border/60 rounded-sm">
                    Login
                  </Button>
                  <Button className="flex-1 bg-pink-600 hover:bg-pink-700 text-white rounded-sm font-semibold">
                    Sign Up
                  </Button>
                </div>
                <Button variant="outline" className="w-full justify-center bg-transparent hover:bg-muted border-border/60 text-foreground flex items-center gap-2 rounded-sm font-semibold text-sm">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l2.45-1.93.12-.03h1.11z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.18-4.53z" fill="#EA4335"/>
                  </svg>
                  Login with Google
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto w-full no-scrollbar">
                <nav className="flex flex-col py-2 w-full">
                  {navLinks.map((link) => (
                    <div key={link.title} className="w-full">
                      {link.dropdown ? (
                        <div className="flex flex-col w-full">
                          <button 
                            className="flex items-center justify-between w-full px-4 py-[14px] text-[15px] font-medium hover:bg-muted/50 transition-colors"
                            onClick={() => toggleAccordion(link.title)}
                          >
                            {link.title}
                            {openAccordion === link.title ? <ChevronUp className="h-4 w-4 opacity-70" /> : <ChevronDown className="h-4 w-4 opacity-70" />}
                          </button>
                          {openAccordion === link.title && (
                            <div className="flex flex-col bg-muted/10 py-1 w-full border-y border-border/30 shadow-inner">
                              {link.dropdown.map((sub) => (
                                <Link
                                  key={sub.title}
                                  href={sub.href}
                                  className={`block px-8 py-2.5 text-[14px] transition-colors hover:bg-muted/60 ${
                                    sub.action ? "text-pink-600 font-semibold" : "text-muted-foreground hover:text-foreground"
                                  }`}
                                >
                                  {sub.title}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <Link
                          href={link.href}
                          className={`flex items-center w-full px-4 py-[14px] text-[15px] font-medium hover:bg-muted/50 transition-colors ${link.title === 'Creators' ? 'text-pink-600' : 'text-foreground'}`}
                        >
                          {link.title}
                        </Link>
                      )}
                    </div>
                  ))}
                  
                  <div className="my-2 mx-4 h-px bg-border/40" />
                  
                  {/* Bottom section */}
                  <div className="flex flex-col pb-4 w-full">
                    <button className="flex items-center justify-between w-full px-4 py-3 text-[14px] font-medium hover:bg-muted/50 transition-colors text-foreground">
                      Language
                      <ChevronDown className="h-4 w-4 opacity-70" />
                    </button>
                    
                    <Link href="#" className="flex items-center gap-3 w-full px-4 py-[10px] text-[14px] font-medium hover:bg-muted/50 transition-colors text-[#5c9ccc]">
                      <Smartphone className="h-[18px] w-[18px] opacity-80" />
                      PornPics App
                    </Link>
                    <Link href="#" className="flex items-center gap-3 w-full px-4 py-[10px] text-[14px] font-medium hover:bg-muted/50 transition-colors text-[#5c9ccc]">
                      <Star className="h-[18px] w-[18px] opacity-80" />
                      Content Creators
                    </Link>
                    <div className="flex items-center gap-3 w-full px-4 py-[10px] text-[14px] font-medium hover:bg-muted/50 transition-colors text-[#5c9ccc] cursor-pointer">
                      <Moon className="h-[18px] w-[18px] opacity-80" />
                      Dark Theme
                    </div>
                    <Link href="#" className="flex items-center gap-3 w-full px-4 py-[10px] text-[14px] font-medium hover:bg-muted/50 transition-colors text-[#5c9ccc]">
                      <MessageSquare className="h-[18px] w-[18px] opacity-80" />
                      Feedback
                    </Link>
                  </div>
                </nav>
              </div>
              <div className="p-4 bg-muted/20 text-xs font-semibold text-muted-foreground text-left cursor-pointer hover:bg-muted/40 transition-colors">
                Alternative version EN-DE
              </div>
            </SheetContent>
          </Sheet>
          <Link href="/" className="flex items-center gap-2">
            <MonitorPlay className="h-6 w-6 text-pink-600" />
            <span className="text-xl font-bold tracking-tight">
              Media<span className="text-pink-600">Lib</span>
            </span>
          </Link>
        </div>

        {/* Center - Search Bar (Desktop) */}
        <div className="hidden flex-1 items-center justify-center px-6 md:flex">
          <form onSubmit={handleSearch} className="flex w-full max-w-2xl items-center border rounded-md bg-secondary/30 focus-within:ring-1 focus-within:ring-ring">
            <div className="flex items-center border-r px-3 text-muted-foreground hover:text-foreground cursor-pointer transition-colors text-sm font-medium">
              <span className="flex items-center gap-1">
                All <ChevronDown className="h-4 w-4" />
              </span>
            </div>
            <Input
              type="search"
              placeholder="Search images, videos, and creators..."
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-3"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button type="submit" variant="ghost" size="icon" className="rounded-l-none text-muted-foreground hover:text-pink-500">
              <Search className="h-4 w-4" />
              <span className="sr-only">Search</span>
            </Button>
          </form>
        </div>

        {/* Right - Actions */}
        <div className="flex flex-1 items-center justify-end gap-2 md:w-1/4">
          {/* Mobile Search Toggle */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileSearchOpen(!mobileSearchOpen)}>
            <Search className="h-5 w-5" />
          </Button>
          <div className="hidden md:flex items-center gap-2">
            <Button variant="ghost" className="font-semibold text-muted-foreground hover:text-foreground">
              Login
            </Button>
            <Button className="bg-pink-600 hover:bg-pink-700 text-white font-semibold">
              Sign Up
            </Button>
          </div>
          <Button variant="ghost" size="icon" className="md:hidden">
            <User className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Search Bar (slides down) */}
      {mobileSearchOpen && (
        <div className="md:hidden border-t px-4 py-3 bg-background">
          <form onSubmit={handleSearch} className="flex items-center border rounded-md bg-secondary/30 focus-within:ring-1 focus-within:ring-ring">
            <Input
              type="search"
              placeholder="Search models, categories, keywords..."
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-3"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            <Button type="submit" variant="ghost" size="icon" className="rounded-l-none text-muted-foreground hover:text-pink-500">
              <Search className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}

      {/* Bottom Tier - Secondary Navigation */}
      <div className="hidden md:block w-full border-t bg-secondary/20">
        <div className="container mx-auto flex h-12 max-w-[1600px] items-center justify-between px-4 md:px-6">
          <NavigationMenu>
            <NavigationMenuList className="gap-1">
              {navLinks.map((link) => (
                <NavigationMenuItem key={link.title}>
                  {link.dropdown ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className={`${navigationMenuTriggerStyle()} bg-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/50 font-medium text-sm flex items-center gap-1 cursor-pointer`}
                        >
                          {link.title}
                          <ChevronDown className="h-3 w-3 opacity-70" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-48 shadow-xl">
                        {link.dropdown.map((sub) => (
                          <DropdownMenuItem key={sub.title} asChild>
                            <Link
                              href={sub.href}
                              className={`w-full cursor-pointer ${
                                sub.action ? "text-pink-600 focus:text-pink-600 font-medium" : ""
                              }`}
                            >
                              {sub.title}
                            </Link>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <Link href={link.href} className={`${navigationMenuTriggerStyle()} bg-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/50 font-medium text-sm`}>
                      {link.title}
                    </Link>
                  )}
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>

          <div className="flex items-center gap-1 text-muted-foreground">
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-foreground">
              <Shuffle className="h-4 w-4" />
            </Button>
            <ModeToggle />
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-foreground">
              <Globe className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
