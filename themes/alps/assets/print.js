// @license magnet:?xt=urn:btih:d3d9a9a6595521f9666a5e94cc830dab83b65699&dn=expat.txt Expat

const print = document.getElementById("print");
print.style.display = "inherit";
print.addEventListener("click", e => {
	e.preventDefault();
	window.print();
});

// @license-end
