const log = console.log
if (window.NodeList && !NodeList.prototype.forEach) {
	NodeList.prototype.forEach = function(callback, thisArg) {
		thisArg = thisArg || window
		for (var i = 0; i < this.length; i++) {
			callback.call(thisArg, this[i], i, this)
		}
	}
}
const getList = (item) => (!isArrayOrList(item) ? [item] : item)
const isArrayOrList = (el) => {
	return (
		Object.prototype.toString.call(el) === '[object Array]' ||
		Object.prototype.toString.call(el) === '[object NodeList]'
	)
}
const css = (items, props) => {
	items = getList(items)
	for (let key in props) {
		if (props.hasOwnProperty(key)) {
			if (key !== null) {
				for (var i = 0; i < items.length; i++) {
					var item = items[i]
					item.style[key] = props[key]
				}
			}
		}
	}
	return items
}
const getTransforms = (translate3d) => {
	return {
		'-webkit-transform': translate3d,
		'-moz-transform': translate3d,
		'-ms-transform': translate3d,
		transform: translate3d
	}
}

const getScrollTop = () => {
	const doc = document.documentElement
	return (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0)
}
const removeClass = (el, className) => {
	el = getList(el)

	let classNames = className.split(' ')

	for (var a = 0; a < classNames.length; a++) {
		className = classNames[a]
		for (var i = 0; i < el.length; i++) {
			var item = el[i]
			if (item.classList) {
				item.classList.remove(className)
			} else {
				item.className = item.className.replace(
					new RegExp(
						'(^|\\b)' + className.split(' ').join('|') + '(\\b|$)',
						'gi'
					),
					' '
				)
			}
		}
	}
	return el
}
const addClass = (el, className) => {
	el = getList(el)

	for (var i = 0; i < el.length; i++) {
		var item = el[i]
		if (item.classList) {
			item.classList.add(className)
		} else {
			item.className += ' ' + className
		}
	}
	return el
}
const hasClass = (el, className) => {
	if (el == null) {
		return false
	}
	if (el.classList) {
		return el.classList.contains(className)
	}
	return new RegExp('(^| )' + className + '( |$)', 'gi').test(el.className)
}
const getAverage = (elements, number) => {
	var sum = 0

	//taking `number` elements from the end to make the average, if there are not enought, 1
	var lastElements = elements.slice(Math.max(elements.length - number, 1))

	for (var i = 0; i < lastElements.length; i++) {
		sum = sum + lastElements[i]
	}

	return Math.ceil(sum / number)
}
const deepExtend = function(out) {
	out = out || {}
	for (let i = 1, len = arguments.length; i < len; ++i) {
		let obj = arguments[i]

		if (!obj) {
			continue
		}
		for (let key in obj) {
			if (!obj.hasOwnProperty(key)) {
				continue
			}

			// based on https://javascriptweblog.wordpress.com/2011/08/08/fixing-the-javascript-typeof-operator/
			if (Object.prototype.toString.call(obj[key]) === '[object Object]') {
				out[key] = deepExtend(out[key], obj[key])
				continue
			}

			out[key] = obj[key]
		}
	}
	return out
}
let isScrollAllowed = {}
isScrollAllowed.m = { up: true, down: true, left: true, right: true }
isScrollAllowed.k = deepExtend({}, isScrollAllowed.m)

const FullScrollPage = class {
	constructor(container) {
		this.$htmlBody = document.querySelectorAll('html, body')
		this.$body = document.querySelector('body')
		this.$container = document.querySelector(container)
		this.$section = document.querySelectorAll('.section')
		this.sectionLenth = this.$section.length
		this.keyId = null
		this.isWindowFocused = null
		this.controlPressed = null
		this.sectionH = null
		this.arraySectionH = []
		this.countSection = 0
		this.g_supportsPassive = false
		this.prevTime = new Date().getTime()
		this.translate3d = null
		this.oldPageY = 0
		this.isTouchDevice = navigator.userAgent.match(
			/(iPhone|iPod|iPad|Android|playbook|silk|BlackBerry|BB10|Windows Phone|Tizen|Bada|webOS|IEMobile|Opera Mini)/
		)
		this.isTouch =
			'ontouchstart' in window ||
			navigator.msMaxTouchPoints > 0 ||
			navigator.maxTouchPoints
		this.MSPointer = this.getMSPointer()
		this.events = {
			touchmove: 'ontouchmove' in window ? 'touchmove' : this.MSPointer.move,
			touchstart: 'ontouchstart' in window ? 'touchstart' : this.MSPointer.down
		}
		this.g_canFireMouseEnterNormalScroll = true
		this.canScroll = true
		this.init()
	}
	init() {
		css(this.$htmlBody, {
			overflow: 'hidden',
			height: '100%'
		})
		css(this.$container, {
			'-ms-touch-action': 'none',
			'touch-action': 'none'
		})
		this.settingHeight()
		this.bindEvent()
		this.setAllowScrolling(true)
		this.setMouseHijack(true)
	}

	bindEvent() {
		let _self = this
		window.addEventListener('resize', () => this.resizeEvt())
		document.addEventListener('keydown', (e) => this.keyDownHandler(e))
		document.addEventListener('keyup', (e) => this.keyUpHandler(e))
	}

	setAllowScrolling(value, directions) {
		if (typeof directions !== 'undefined') {
			directions = directions.replace(/ /g, '').split(',')

			directions.forEach(function(direction) {
				this.setIsScrollAllowed(value, direction, 'm')
			})
		} else {
			this.setIsScrollAllowed(value, 'all', 'm')
		}
	}
	setIsScrollAllowed(value, direction, type) {
		//up, down, left, right
		if (direction !== 'all') {
			isScrollAllowed[type][direction] = value
		} else {
			Object.keys(isScrollAllowed[type]).forEach(function(key) {
				isScrollAllowed[type][key] = value
			})
		}
	}

	setMouseHijack(value) {
		if (value) {
			this.setMouseWheelScrolling(true)
			this.addTouchHandler()
		} else {
			this.setMouseWheelScrolling(false)
			this.removeTouchHandler()
		}
	}
	setMouseWheelScrolling(value) {
		if (value) {
			this.addMouseWheelHandler()
		} else {
			this.removeMouseWheelHandler()
		}
	}

	addMouseWheelHandler() {
		let prefix = ''
		let _addEventListener

		if (window.addEventListener) {
			_addEventListener = 'addEventListener'
		} else {
			_addEventListener = 'attachEvent'
			prefix = 'on'
		}

		// detect available wheel event
		let support =
			'onwheel' in document.createElement('div')
				? 'wheel' // Modern browsers support "wheel"
				: document.onmousewheel !== undefined
				? 'mousewheel' // Webkit and IE support at least "mousewheel"
				: 'DOMMouseScroll' // let's assume that remaining browsers are older Firefox
		let passiveEvent = this.g_supportsPassive ? { passive: false } : false

		if (support == 'DOMMouseScroll') {
			document[_addEventListener](
				prefix + 'MozMousePixelScroll',
				this.MouseWheelHandler,
				passiveEvent
			)
		}

		//handle MozMousePixelScroll in older Firefox
		else {
			document[_addEventListener](
				prefix + support,
				this.MouseWheelHandler,
				passiveEvent
			)
		}
	}
	removeMouseWheelHandler() {
		if (document.addEventListener) {
			document.removeEventListener('mousewheel', this.MouseWheelHandler, false) //IE9, Chrome, Safari, Oper
			document.removeEventListener('wheel', this.MouseWheelHandler, false) //Firefox
			document.removeEventListener(
				'MozMousePixelScroll',
				this.MouseWheelHandler,
				false
			) //old Firefox
		} else {
			document.detachEvent('onmousewheel', this.MouseWheelHandler) //IE 6/7/8
		}
	}

	MouseWheelHandler = (e) => {
		let curTime = new Date().getTime()
		let scrollings = []
		e = e || window.event
		const value = e.wheelDelta || -e.deltaY || -e.detail
		const delta = Math.max(-1, Math.min(1, value))

		const horizontalDetection =
			typeof e.wheelDeltaX !== 'undefined' || typeof e.deltaX !== 'undefined'
		const isScrollingVertically =
			Math.abs(e.wheelDeltaX) < Math.abs(e.wheelDelta) ||
			Math.abs(e.deltaX) < Math.abs(e.deltaY) ||
			!horizontalDetection

		//Limiting the array to 150 (lets not waste memory!)
		if (scrollings.length > 149) {
			scrollings.shift()
		}

		//keeping record of the previous scrollings
		scrollings.push(Math.abs(value))

		//time difference between the last scroll and the current one
		let timeDiff = curTime - this.prevTime
		this.prevTime = curTime

		//haven't they scrolled in a while?
		//(enough to be consider a different scrolling action to scroll another section)
		if (timeDiff > 200) {
			//emptying the array, we dont care about old scrollings for our averages
			scrollings = []
		}
		let averageEnd = getAverage(scrollings, 10)
		let averageMiddle = getAverage(scrollings, 70)
		let isAccelerating = averageEnd >= averageMiddle

		//to avoid double swipes...
		if (isAccelerating && isScrollingVertically) {
			//scrolling down?
			if (delta < 0) {
				this.scrolling('down')
			} else {
				this.scrolling('up')
			}
		}
		return false
	}
	scrolling = (type) => {
		clearTimeout(this.keyId)
		const scrollSection =
			type === 'down' ? this.moveSectionDown : this.moveSectionUp
		this.keyId = setTimeout(() => scrollSection(), 300)
	}
	moveSectionDown = () => {
		this.movePage('down')
	}
	moveSectionUp = () => {
		this.movePage('up')
	}
	movePage = (direction) => {
		if (direction === null) return
		direction === 'down' ? (this.countSection += 1) : (this.countSection -= 1)
		if (this.countSection === this.$section.length) {
			this.countSection -= 1
			return
		}
		if (this.countSection == -1) {
			this.countSection = 0
			return
		}
		removeClass(this.$container, 'no_transition')
		removeClass(this.$section, 'active')
		this.translate3d =
			'translate3d(0px, -' + this.arraySectionH[this.countSection] + 'px, 0px)'
		css(this.$container, getTransforms(this.translate3d))
		addClass(this.$section[this.countSection], 'active')
	}

	addTouchHandler() {
		if (this.isTouchDevice || this.isTouch) {
			this.$body.removeEventListener(events.touchmove, preventBouncing, {
				passive: false
			})
			this.$body.addEventListener(events.touchmove, preventBouncing, {
				passive: false
			})

			const touchWrapper = this.$container
			touchWrapper.removeEventListener(events.touchstart, touchStartHandler)
			touchWrapper.removeEventListener(events.touchmove, touchMoveHandler, {
				passive: false
			})

			touchWrapper.addEventListener(events.touchstart, touchStartHandler)
			touchWrapper.addEventListener(events.touchmove, touchMoveHandler, {
				passive: false
			})
		}
	}

	/**
	 * Removes the auto scrolling for touch devices.
	 */
	removeTouchHandler() {
		if (this.isTouchDevice || this.isTouch) {
			// normalScrollElements requires it off #2691
			if (options.autoScrolling) {
				$body.removeEventListener(events.touchmove, touchMoveHandler, {
					passive: false
				})
				$body.removeEventListener(events.touchmove, preventBouncing, {
					passive: false
				})
			}
			var touchWrapper = options.touchWrapper
			touchWrapper.removeEventListener(events.touchstart, touchStartHandler)
			touchWrapper.removeEventListener(events.touchmove, touchMoveHandler, {
				passive: false
			})
		}
	}

	getMSPointer() {
		let pointer

		//IE >= 11 & rest of browsers
		if (window.PointerEvent) {
			pointer = { down: 'pointerdown', move: 'pointermove' }
		} else {
			pointer = { down: 'MSPointerDown', move: 'MSPointerMove' }
		}
		return pointer
	}

	keyDownHandler(e) {
		clearTimeout(this.keyId)
		let keyControls = [40, 38, 32, 33, 34]
		let keyCode = e.keyCode
		if (keyControls.indexOf(keyCode) > -1) {
			e.preventDefault()
			this.keyId = setTimeout(() => this.onkeydown(e), 300)
		}
	}
	onkeydown(e) {
		if (e.keyCode === 40) {
			this.movePage('down')
		} else if (e.keyCode === 38) {
			this.movePage('up')
		}
	}

	keyUpHandler(e) {
		if (this.isWindowFocused) {
			//the keyup gets fired on new tab ctrl + t in Firefox
			this.controlPressed = e.ctrlKey
		}
	}
	settingHeight() {
		this.sectionH =
			'innerHeight' in window
				? window.innerHeight
				: document.documentElement.offsetHeight
		this.arraySectionH = []
		this.$section.forEach((elm) => (elm.style.height = this.sectionH + 'px'))
		for (let i = 0, max = this.sectionLenth; i < max; i++) {
			this.arraySectionH.push(this.sectionH * i)
		}
	}
	resizeEvt() {
		this.settingHeight()
		this.translate3d =
			'translate3d(0px, -' + this.arraySectionH[this.countSection] + 'px, 0px)'
		addClass(this.$container, 'no_transition')
		css(this.$container, getTransforms(this.translate3d))
	}
}
window.addEventListener('DOMContentLoaded', () => {
	const eventFullpage = new FullScrollPage('#full_page')
})
