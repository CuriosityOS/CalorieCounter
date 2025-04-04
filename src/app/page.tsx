import UserDashboard from "@/components/app/UserDashboard";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-8">
       <h1 className="text-3xl font-bold mb-8">CalorieCounter</h1>
       <UserDashboard />
    </main>
  );
}
