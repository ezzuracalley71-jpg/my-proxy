"use strict";

(function() {
    var PIN = "1194";
    var KEY = "nx_pin_unlocked";
    
    function checkPIN() {
        var overlay = document.getElementById("pin-overlay");
        var input = document.getElementById("pin-input");
        var error = document.getElementById("pin-error");
        
        if (!overlay || !input) {
            console.log("PIN elements not found");
            return;
        }
        
        // Check if already unlocked
        try {
            if (localStorage.getItem(KEY) === "unlocked") {
                console.log("Already unlocked, hiding overlay");
                overlay.style.display = "none";
                overlay.setAttribute("hidden", "");
                return;
            }
        } catch(e) {
            console.log("localStorage error:", e);
        }
        
        // Show overlay
        console.log("Showing PIN lock");
        overlay.removeAttribute("hidden");
        overlay.style.display = "flex";
        
        // Handle Enter key
        input.onkeydown = function(e) {
            if (e.key === "Enter") {
                e.preventDefault();
                var entered = input.value.trim();
                console.log("Entered:", entered, "Expected:", PIN);
                
                if (entered === PIN) {
                    try {
                        localStorage.setItem(KEY, "unlocked");
                    } catch(e) {}
                    overlay.style.display = "none";
                    overlay.setAttribute("hidden", "");
                    console.log("Unlocked!");
                } else {
                    input.value = "";
                    input.focus();
                    if (error) {
                        error.textContent = "Wrong PIN - try 1194";
                        error.style.display = "block";
                    }
                }
            }
        };
        
        input.focus();
    }
    
    // Run after DOM is ready
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", checkPIN);
    } else {
        checkPIN();
    }
    
    // Expose reset function
    window.resetPIN = function() {
        try {
            localStorage.removeItem(KEY);
        } catch(e) {}
        location.reload();
    };
})();
