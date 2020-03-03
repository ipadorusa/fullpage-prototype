const log = console.log;
const getList = (item) => (!isArrayOrList(item) ? [item] : item);
const isArrayOrList = (el) => {
	return (
		Object.prototype.toString.call(el) === "[object Array]" ||
		Object.prototype.toString.call(el) === "[object NodeList]"
	);
};
const css = (items, props) => {
	items = getList(items);
	for (let key in props) {
		if (props.hasOwnProperty(key)) {
			if (key !== null) {
				for (var i = 0; i < items.length; i++) {
					var item = items[i];
					item.style[key] = props[key];
				}
			}
		}
	}
	return items;
};
const getTransforms = (translate3d) => {
	return {
		"-webkit-transform": translate3d,
		"-moz-transform": translate3d,
		"-ms-transform": translate3d,
		transform: translate3d
	};
};

const mouseDownHandler = (e) => {
	if (e.which == 2) {
		console.log("a", e.which);
		oldPageY = e.pageY;
		//container.addEventListener('mousemove', mouseMoveHandler);
	}
};
const mouseUpHandler = (e) => {
	if (e.which == 2) {
		console.log("b", e.which);
		//container.removeEventListener('mousemove', mouseMoveHandler);
	}
};
const addMouseWheelHandler = () => {
	let prefix = "";
	let _addEventListener;

	if (window.addEventListener) {
		_addEventListener = "addEventListener";
	} else {
		_addEventListener = "attachEvent";
		prefix = "on";
	}

	// detect available wheel event
	let support =
		"onwheel" in document.createElement("div")
			? "wheel" // Modern browsers support "wheel"
			: document.onmousewheel !== undefined
			? "mousewheel" // Webkit and IE support at least "mousewheel"
			: "DOMMouseScroll"; // let's assume that remaining browsers are older Firefox
	let passiveEvent = g_supportsPassive ? { passive: false } : false;

	if (support == "DOMMouseScroll") {
		document[_addEventListener](
			prefix + "MozMousePixelScroll",
			MouseWheelHandler,
			passiveEvent
		);
	}

	//handle MozMousePixelScroll in older Firefox
	else {
		document[_addEventListener](
			prefix + support,
			MouseWheelHandler,
			passiveEvent
		);
	}
};
const getScrollTop = () => {
	const doc = document.documentElement;
	return (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0);
};
const removeClass = (el, className) => {
	el = getList(el);

	let classNames = className.split(" ");

	for (var a = 0; a < classNames.length; a++) {
		className = classNames[a];
		for (var i = 0; i < el.length; i++) {
			var item = el[i];
			if (item.classList) {
				item.classList.remove(className);
			} else {
				item.className = item.className.replace(
					new RegExp(
						"(^|\\b)" + className.split(" ").join("|") + "(\\b|$)",
						"gi"
					),
					" "
				);
			}
		}
	}
	return el;
};
const addClass = (el, className) => {
	el = getList(el);

	for (var i = 0; i < el.length; i++) {
		var item = el[i];
		if (item.classList) {
			item.classList.add(className);
		} else {
			item.className += " " + className;
		}
	}
	return el;
};

const FullScrollPage = class {
	constructor(container) {
		this.$htmlBody = document.querySelectorAll("html, body");
		this.$container = document.querySelector(container);
		this.$section = document.querySelectorAll(".section");
		this.sectionLenth = this.$section.length;
		this.keyId = null;
		this.isWindowFocused = null;
		this.controlPressed = null;
		this.sectionH = null;
		this.arraySectionH = [];
		this.countSection = 0;
		this.init();
	}
	init() {
		css(this.$htmlBody, {
			overflow: "hidden",
			height: "100%"
		});
		css(this.$container, {
			"-ms-touch-action": "none",
			"touch-action": "none"
		});
		this.settingHeight();
		this.bindEvent();
	}

	bindEvent() {
		window.addEventListener("scroll", () => this.scrollHandler());
		window.addEventListener("resize", () => this.resizeEvt());
		document.addEventListener("keydown", (e) => this.keyDownHandler(e));
		document.addEventListener("keyup", (e) => this.keyUpHandler(e));
		this.$container.addEventListener("mousedown", (e) => mouseDownHandler(e));
		this.$container.addEventListener("mouseup", (e) => mouseUpHandler(e));
	}

	scrollHandler() {
		console.log("aa");
	}
	setMouseWheelScrolling(value) {
		if (value) {
			this.addMouseWheelHandler();
			this.addMiddleWheelHandler();
		} else {
			this.removeMouseWheelHandler();
			this.removeMiddleWheelHandler();
		}
	}
	setMouseHijack(value) {
		if (value) {
			this.setMouseWheelScrolling(true);
			this.addTouchHandler();
		} else {
			this.setMouseWheelScrolling(false);
			this.removeTouchHandler();
		}
	}

	keyDownHandler(e) {
		clearTimeout(this.keydownId);
		let keyControls = [40, 38, 32, 33, 34];
		let keyCode = e.keyCode;
		if (keyControls.indexOf(keyCode) > -1) {
			e.preventDefault();
			this.keyId = setTimeout(() => this.onkeydown(e), 500);
		}
	}
	onkeydown(e) {
		let translate3d = null;
		if (e.keyCode === 40) {
			this.countSection += 1;
			if (this.countSection === this.$section.length) {
				this.countSection -= 1;
				return;
			}
			removeClass(this.$container, "no_transition");
			removeClass(this.$section, "active");
			addClass(this.$section[this.countSection], "active");
			translate3d =
				"translate3d(0px, -" +
				this.arraySectionH[this.countSection] +
				"px, 0px)";
			css(this.$container, getTransforms(translate3d));
		} else if (e.keyCode === 38) {
			this.countSection -= 1;
			if (this.countSection == -1) {
				this.countSection = 0;
				return;
			}
			removeClass(this.$container, "no_transition");
			removeClass(this.$section, "active");
			addClass(this.$section[this.countSection], "active");
			translate3d =
				"translate3d(0px, -" +
				this.arraySectionH[this.countSection] +
				"px, 0px)";
			css(this.$container, getTransforms(translate3d));
		}
	}

	keyUpHandler(e) {
		if (this.isWindowFocused) {
			//the keyup gets fired on new tab ctrl + t in Firefox
			this.controlPressed = e.ctrlKey;
		}
	}
	settingHeight() {
		this.sectionH = window.innerHeight;
		this.arraySectionH = [];
		this.$section.forEach((elm) => (elm.style.height = this.sectionH + "px"));
		for (let i = 0, max = this.sectionLenth; i < max; i++) {
			this.arraySectionH.push(this.sectionH * i);
		}
	}
	resizeEvt() {
		this.settingHeight();
		let translate3d =
			"translate3d(0px, -" + this.arraySectionH[this.countSection] + "px, 0px)";
		addClass(this.$container, "no_transition");
		css(this.$container, getTransforms(translate3d));
	}
};
window.addEventListener("DOMContentLoaded", () => {
	const eventFullpage = new FullScrollPage("#full_page");
});
