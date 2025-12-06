"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("demo@demo.com");
  const [password, setPassword] = useState("12345");
  const router = useRouter();

  const handleLogin = () => {
    // TODO: Implement actual login logic
    console.log("Login attempt:", { email, password });
    if (email === "demo@demo.com" && password === "12345") {
      // Redirect to /edit page
      router.push("/edit");
    } else {
      alert("Email veya şifre hatalı!");
    }
  };
  return (
    <div className="flex h-screen w-full flex-col bg-white">
      {/* Main Content - Split Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Section - Login/Signup Form (full width on mobile, 1/2 on desktop) */}
        <div className="flex w-full md:w-1/2 flex-col px-6 md:px-12 py-8">
          {/* Main Content - Centered */}
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-md">

            {/* Welcome Message */}
            <h1 className="mb-3 text-4xl font-bold text-gray-900">
              Welcome to looka
            </h1>
            <p className="mb-10 text-base text-gray-600">Login to your account</p>

            {/* Login Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLogin();
              }}
              className="mb-6 space-y-4"
            >
              {/* Email Input */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Password Input */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Login Button */}
              <button
                type="submit"
                className="w-full rounded-lg bg-black px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
              >
                Login
              </button>
            </form>

          </div>
        </div>
      </div>

        {/* Right Section - Beautiful Gradient Table Design (1/2 width) - Hidden on mobile */}
        <div className="hidden md:block relative w-1/2 border-l-2 border-gray-200 overflow-hidden">
          {/* Base gradient - main pastel color flow */}
          <div className="absolute inset-0 bg-gradient-to-br from-violet-100 via-fuchsia-100 to-pink-100"></div>
          
          {/* Multiple overlay gradients for depth and richness */}
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-200/60 via-transparent to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-transparent via-transparent to-blue-200/50"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-rose-200/40 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-l from-cyan-200/30 via-transparent to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-indigo-200/35 via-transparent to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-pink-200/35"></div>
          
          {/* Organic gradient shapes with blur - pastel colors */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-pink-300/50 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-purple-300/50 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-br from-violet-200/40 via-fuchsia-200/30 to-transparent rounded-full blur-3xl"></div>
          
          {/* Additional pastel gradient layers */}
          <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-gradient-to-br from-purple-200/40 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-gradient-to-tr from-orange-200/40 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute top-3/4 right-1/3 w-[350px] h-[350px] bg-gradient-to-br from-sky-200/35 to-transparent rounded-full blur-3xl"></div>
          
          {/* More subtle pastel overlays */}
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-100/25 via-transparent to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-transparent via-transparent to-orange-100/25"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-200/20 to-transparent"></div>
          
          {/* Table-like gradient grid pattern */}
          <div className="absolute inset-0 grid grid-cols-8 grid-rows-12 gap-0 opacity-30">
            {Array.from({ length: 96 }).map((_, i) => {
              const row = Math.floor(i / 8);
              const col = i % 8;
              const hue = (row * 30 + col * 15) % 360;
              // Use fixed opacity values to avoid hydration mismatch
              const opacityValues = [0.4, 0.45, 0.5, 0.45, 0.4, 0.5, 0.45, 0.4];
              const opacity = opacityValues[(row + col) % 8];
              return (
                <div
                  key={i}
                  className="bg-gradient-to-br"
                  style={{
                    backgroundImage: `linear-gradient(135deg, 
                      hsl(${hue}, 70%, 85%) 0%, 
                      hsl(${(hue + 30) % 360}, 70%, 80%) 50%, 
                      hsl(${(hue + 60) % 360}, 70%, 85%) 100%)`,
                    opacity: opacity,
                  }}
                />
              );
            })}
          </div>
          
          {/* Overlay grid lines for table effect */}
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '12.5% 8.33%',
          }}></div>
        </div>
      </div>
    </div>
  );
}

