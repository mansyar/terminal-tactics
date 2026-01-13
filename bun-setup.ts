import { JSDOM } from 'jsdom'

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost',
})

// @ts-ignore -- Polyfilling window for JSDOM environment
global.window = dom.window
global.document = dom.window.document
global.Element = dom.window.Element
global.navigator = dom.window.navigator
global.HTMLElement = dom.window.HTMLElement
global.Node = dom.window.Node

// Polyfill for scrollIntoView (common in JSDOM tests)
Element.prototype.scrollIntoView = () => {}
