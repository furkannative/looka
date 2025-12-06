"use client";

import { useEffect } from "react";

export default function EditLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Hide header and footer for edit page
    const header = document.querySelector("header");
    const footer = document.querySelector("footer");
    if (header) header.style.display = "none";
    if (footer) footer.style.display = "none";
    
    // Make body full screen
    document.body.style.overflow = "hidden";
    
    return () => {
      // Restore on unmount
      if (header) header.style.display = "";
      if (footer) footer.style.display = "";
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-white">
      {children}
    </div>
  );
}

