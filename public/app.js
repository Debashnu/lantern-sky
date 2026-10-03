const form = document.querySelector("#wishForm");
const wish = document.querySelector("#wish");
const count = document.querySelector("#count");

// Show how many characters are left to use
wish.addEventListener("input", () => {
  count.textContent = wish.value.length;
});

// Phase 2 will turn this into a floating lantern. For now, just stop the page reloading.
form.addEventListener("submit", (event) => {
  event.preventDefault();
  console.log("Wish:", wish.value);
});
