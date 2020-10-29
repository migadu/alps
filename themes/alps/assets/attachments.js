let attachments = [];

const headers = document.querySelector(".create-update .headers");
headers.classList.remove("no-js");

const attachmentsNode = document.getElementById("attachment-list");
attachmentsNode.style.display = '';
const helpNode = attachmentsNode.querySelector(".help");

const attachmentsInput = headers.querySelector("input[type='file']");
attachmentsInput.removeAttribute("name");
attachmentsInput.addEventListener("input", ev => {
	const files = attachmentsInput.files;
	for (let i = 0; i < files.length; i++) {
		attachFile(files[i]);
	}
});

window.addEventListener("drop", ev => {
	ev.preventDefault();
	const files = ev.dataTransfer.files;
	for (let i = 0; i < files.length; i++) {
		attachFile(files[i]);
	}
});

const sendButton = document.getElementById("send-button"),
	saveButton = document.getElementById("save-button");

const attachmentUUIDsNode = document.getElementById("attachment-uuids");
function updateState() {
	let complete = true;
	for (let i = 0; i < attachments.length; i++) {
		const a = attachments[i];
		const progress = a.node.querySelector(".progress");
		progress.style.width = `${Math.floor(a.progress * 100)}%`;
		complete &= a.progress === 1.0;
		if (a.progress === 1.0) {
			progress.style.display = 'none';
		}
	}

	if (complete) {
		sendButton.removeAttribute("disabled");
		saveButton.removeAttribute("disabled");
	} else {
		sendButton.setAttribute("disabled", "disabled");
		saveButton.setAttribute("disabled", "disabled");
	}

	attachmentUUIDsNode.value = attachments.
		filter(a => a.progress === 1.0).
		map(a => a.uuid).
		join(",");
}

function attachFile(file) {
	helpNode.remove();

	const xhr = new XMLHttpRequest();
	const node = attachmentNodeFor(file);
	const attachment = {
		node: node,
		progress: 0,
		xhr: xhr,
	};
	attachments.push(attachment);
	attachmentsNode.appendChild(node);

	let formData = new FormData();
	formData.append("attachments", file);

	xhr.open("POST", "/compose/attachment");
	xhr.upload.addEventListener("progress", ev => {
		attachment.progress = ev.loaded / ev.total;
		updateState();
	});
	xhr.addEventListener("load", () => {
		// TODO: Handle errors
		const resp = JSON.parse(xhr.responseText);
		attachment.uuid = resp[0];
		updateState();
	});
	xhr.send(formData);

	updateState();
}

function attachmentNodeFor(file) {
	const node = document.createElement("div"),
		progress = document.createElement("span"),
		filename = document.createElement("span"),
		size = document.createElement("span"),
		button = document.createElement("button");
	node.classList.add("upload");

	progress.classList.add("progress");
	node.appendChild(progress);

	filename.classList.add("filename");
	filename.innerText = file.name;
	node.appendChild(filename);

	size.classList.add("size");
	size.innerText = formatSI(file.size) + "B";
	node.appendChild(size);

	button.innerHTML = "&times";
	node.appendChild(button);
	return node;
}

// via https://github.com/ThomWright/format-si-prefix; MIT license
// Copyright (c) 2015 Thom Wright
const PREFIXES = {
  '24': 'Y', '21': 'Z', '18': 'E', '15': 'P', '12': 'T', '9': 'G', '6': 'M',
  '3': 'k', '0': '', '-3': 'm', '-6': 'µ', '-9': 'n', '-12': 'p', '-15': 'f',
  '-18': 'a', '-21': 'z', '-24': 'y'
};

function formatSI(num) {
  if (num === 0) {
    return '0';
  }
  let sig = Math.abs(num); // significand
  let exponent = 0;
  while (sig >= 1000 && exponent < 24) {
    sig /= 1000;
    exponent += 3;
  }
  while (sig < 1 && exponent > -24) {
    sig *= 1000;
    exponent -= 3;
  }
  const signPrefix = num < 0 ? '-' : '';
  if (sig > 1000) {
    return signPrefix + sig.toFixed(0) + PREFIXES[exponent];
  }
  return signPrefix + parseFloat(sig.toPrecision(3)) + PREFIXES[exponent];
}
