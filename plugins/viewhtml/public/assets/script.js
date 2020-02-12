var emailFrame = document.getElementById("email-frame");
if (emailFrame) {
	// Resize the frame with its content
	var resizeFrame = function() {
		emailFrame.style.height = emailFrame.contentWindow.document.documentElement.scrollHeight + "px";
	};
	emailFrame.addEventListener("load", resizeFrame);
	emailFrame.contentWindow.addEventListener("resize", resizeFrame);

	// Polyfill in case the srcdoc attribute isn't supported
	if (!emailFrame.srcdoc) {
		var srcdoc = emailFrame.getAttribute("srcdoc");
		var doc = emailFrame.contentWindow.document;
		doc.open();
		doc.write(srcdoc);
		doc.close();
	}
}
