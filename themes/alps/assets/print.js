const print = document.getElementById("print");
print.style.display = "inherit";
print.addEventListener("click", e => {
	e.preventDefault();
	window.print();
});
