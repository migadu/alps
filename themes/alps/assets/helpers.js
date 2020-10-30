const check_all = document.getElementById("action-checkbox-all");
if (check_all) {
	check_all.style.display = "inherit";
	check_all.addEventListener("click", ev => {
		const inputs = document.querySelectorAll(".message-list-checkbox input");
		for (let i = 0; i < inputs.length; i++) {
			inputs[i].checked = ev.target.checked;
		}
	});
}
