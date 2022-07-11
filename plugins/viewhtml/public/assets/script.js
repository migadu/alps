var emailFrame = document.getElementById("email-frame");
if (emailFrame) {
	// Resize the frame with its content
	var resizeFrame = function() {
		emailFrame.style.height = emailFrame.contentWindow.document.documentElement.scrollHeight + "px";
	};
	emailFrame.addEventListener("load", resizeFrame);
	emailFrame.contentWindow.addEventListener("resize", resizeFrame);
}
