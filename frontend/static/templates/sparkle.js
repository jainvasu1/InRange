document.addEventListener("mousemove", (e) => {
    const sparkle = document.createElement("div");
    sparkle.className = "sparkle";
    document.body.appendChild(sparkle);
  
    sparkle.style.left = `${e.pageX}px`;
    sparkle.style.top = `${e.pageY}px`;
  
    // Remove sparkle after animation ends
    setTimeout(() => {
      sparkle.remove();
    }, 1000);
  });
  