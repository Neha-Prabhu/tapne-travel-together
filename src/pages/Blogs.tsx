import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Calendar } from "lucide-react";

const mockBlogs = [
  { id: "b1", title: "My First Solo Trip to Goa — Lessons Learned", author: "Arjun Mehta", coverImage: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600&q=80", date: "2026-02-20", trip: "Goa Backpacking", content: "A story of adventure..." },
  { id: "b2", title: "Surviving Hampta Pass: A Beginner's Trek Story", author: "Ravi Kumar", coverImage: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=600&q=80", date: "2026-02-18", trip: "Himachal Trek", content: "" },
  { id: "b3", title: "Why Bali Changed My Perspective on Travel", author: "Priya Sharma", coverImage: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80", date: "2026-02-15", content: "" },
  { id: "b4", title: "Desert Nights in Jaisalmer — A Photo Journal", author: "Karan Singh", coverImage: "https://images.unsplash.com/photo-1477587458883-47145ed94245?w=600&q=80", date: "2026-02-10", trip: "Rajasthan Camp", content: "" },
  { id: "b5", title: "Kerala Backwaters: The Ultimate Wellness Guide", author: "Meera Nair", coverImage: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=600&q=80", date: "2026-02-08", content: "" },
  { id: "b6", title: "Ladakh Road Trip Essentials You Can't Miss", author: "Arjun Mehta", coverImage: "https://images.unsplash.com/photo-1626014303715-48c7b1a7a814?w=600&q=80", date: "2026-02-05", trip: "Ladakh Road Trip", content: "" },
];

const Blogs = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <h1 className="mb-2 text-3xl font-bold text-foreground">Blogs</h1>
          <p className="mb-8 text-muted-foreground">Stories, tips, and experiences from the Tapne community.</p>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {mockBlogs.map(blog => (
              <Card key={blog.id} className="group overflow-hidden transition-shadow hover:shadow-lg">
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img src={blog.coverImage} alt={blog.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  {blog.trip && <Badge className="absolute left-3 top-3 bg-primary/90 text-primary-foreground text-xs">{blog.trip}</Badge>}
                </div>
                <CardContent className="p-4">
                  <h3 className="mb-2 line-clamp-2 text-base font-semibold leading-tight text-foreground group-hover:text-primary transition-colors">{blog.title}</h3>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1"><User className="h-3 w-3" />{blog.author}</div>
                    <div className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(blog.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Blogs;
