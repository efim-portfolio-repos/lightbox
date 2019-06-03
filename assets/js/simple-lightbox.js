(function ($) {
    var namespace = "simpleLightbox";
    var margins = {
        top: 64,
        bottom: 64,
        left: 32,
        right: 32
    };
    var threshold = 50;

    var usetouches = 'ontouchstart' in window;

    var touchEventSettings = {
        start: usetouches ? "touchstart" : "mousedown",
        move: usetouches ? "touchmove" : "mousemove",
        end: usetouches ? "touchend" : "mouseup"
    }

    if (usetouches) {
        touchEventSettings.getX = function (e) {
            return e.touches[0].pageX;
        };
    } else {
        touchEventSettings.getX = function (e) {
            return e.pageX;
        }
    }

    var getNewImageSize = function (imageSize, viewportSize) {
        if (viewportSize.width > imageSize.width && viewportSize.height > imageSize.height) {
            return {
                width: imageSize.width,
                height: imageSize.height
            };
        } else {
            var imageRatio = imageSize.width / imageSize.height;
            var viewportRatio = viewportSize.width / viewportSize.height;

            var newImageSize = {
                width: viewportSize.width,
                height: viewportSize.height
            }
            if (imageRatio > viewportRatio) {
                newImageSize.height = viewportSize.width / imageRatio;
            } else {
                newImageSize.width = viewportSize.height * imageRatio;
            }
            return newImageSize;
        }
    };

    var hideArrow = function (data) {
        data.modal.previousButton.fadeOut(200);
        data.modal.nextButton.fadeOut(200);
        data.modal.arrowVisible = false;
    };

    var showArrow = function (data, time) {
        if (!data.modal.arrowVisible) {
            data.modal.arrowVisible = true;
            if (data.modal.imageIndex > 0) {
                data.modal.previousButton.fadeIn(200);
            }
            if (data.images.length > data.modal.imageIndex + 1) {
                data.modal.nextButton.fadeIn(200);
            }

            if (data.modal.hideArrowTimeout) {
                clearTimeout(data.modal.hideArrowTimeout);
            }

            data.modal.hideArrowTimeout = setTimeout(function () {
                hideArrow(data);
            }, time)
        }
    };

    var loadImage = function (data) {
        data.modal.preloader.show();
        data.modal.nextButton.hide();
        data.modal.previousButton.hide()

        data.modal.imageLoaded = false;

        var image = new Image();
        image.src = data.images[data.modal.imageIndex].src;
        var $image = $(image).css({ "opacity": 0 });
        data.modal.image = $image;
        data.modal.lightboxFrame.append($image);


        image.onload = function () {
            if (data.modal.show) {
                data.modal.imageLoaded = true;
                var imageSize = getNewImageSize({ width: image.naturalWidth, height: image.naturalHeight }, { width: window.innerWidth - margins.left - margins.right, height: window.innerHeight - margins.top - margins.bottom });
                data.modal.lightboxFrame.animate({ "width": imageSize.width, "height": imageSize.height }, 400, function () {
                    data.modal.preloader.hide();
                    $image.animate({ "opacity": 1 }, 400, function () {
                        showArrow(data, 2000);
                    });
                });
            }

        };
    };

    var methods = {
        init: function (options) {
            var settings = {
                classes: {
                    link: "wl-lightbox-link",
                    closeButton: "li-close",
                    navButton: "lightbox-nav-btn",
                    nextButton: "lightbox-next-btn",
                    previousButton: "lightbox-previous-btn",
                    preloader: "lightbox-preloader",
                    lightboxFrame: "lightbox-modal",
                    arrowIconLeft: "li-left-arrow",
                    arrowIconRight: "li-right-arrow",
                    contentBlocker: "lightbox-content-blocker",
                    hidden: "wl-l-hiden"
                }
            };

            var data = this.data(namespace);

            if (!data) {
                data = {};
                settings = $.extend(settings, options);

                var $this = this;

                var images = [];

                this.find("a > img").each(function (i, el) {
                    let $this = $(this);
                    let $parent = $this.parent();

                    $parent.addClass(settings.classes.link);
                    $parent.data(namespace, {
                        index: i
                    });

                    let image = {
                        name: $this.attr("alt"),
                        src: $parent.attr("href")
                    };
                    images.push(image);
                });

                this.on("click." + namespace, "." + settings.classes.link, function (e) {
                    e.preventDefault();

                    let index = $(e.currentTarget).data(namespace).index;

                    methods.show.call($this, index);
                })

                $(window).on("resize." + namespace, function () {
                    if (data.modal.show && data.modal.imageLoaded) {
                        let image = data.modal.image[0];
                        let imageSize = getNewImageSize({ width: image.naturalWidth, height: image.naturalHeight }, { width: window.innerWidth - margins.left - margins.right, height: window.innerHeight - margins.top - margins.bottom });
                        data.modal.lightboxFrame.css({ "width": imageSize.width, "height": imageSize.height });
                    }
                });

                var $closeButton = $("<i class='" + settings.classes.closeButton + "'></i>");
                var $previousButton = $("<div class='" + settings.classes.navButton + " " + settings.classes.previousButton + "'><i class='" + settings.classes.arrowIconLeft + "'></i></div>").hide();
                var $nextButton = $("<div class='" + settings.classes.navButton + " " + settings.classes.nextButton + "'><i class='" + settings.classes.arrowIconRight + "'></i></div>").hide();
                var $preloader = $("<div class='" + settings.classes.preloader +"'></div>").hide();
                var $lightboxFrame = $("<div class='" + settings.classes.lightboxFrame + "'></div>").append($closeButton).append($previousButton).append($nextButton).append($preloader).hide().addClass(settings.classes.hidden);
                var $contentBlocker = $("<div class='" + settings.classes.contentBlocker + "'></div>").append($lightboxFrame).hide();

                data.target = $this;
                data.images = images;
                data.modal = {
                    show: false,
                    imageLoaded: false,
                    arrowVisible: false,
                    closeButton: $closeButton,
                    previousButton: $previousButton,
                    nextButton: $nextButton,
                    preloader: $preloader,
                    lightboxFrame: $lightboxFrame,
                    contentBlocker: $contentBlocker
                };
                data.settings = settings;

                this.data(namespace, data);
            }

            return this;
        },
        destroy: function () {
            var data = this.data(namespace);

            this.find("." + data.settings.classes.link).each(function () {
                let $this = $(this);
                $this.removeClass("." + data.settings.classes.link);
                $this.removeData(namespace);
            });;

            this.off("." + namespace);
            $(window).off("." + namespace);
            data.contentBlocker.closeButton.off("." + namespace);

            this.removeData(namespace);
        },
        close: function () {
            var data = this.data(namespace);

            if (data.modal.show) {
                data.modal.contentBlocker.hide();
                data.modal.image[0].onload = null;
                data.modal.contentBlocker.remove();
                $("body").css("overflow", "");
                data.modal.show = false;
                data.modal.imageLoaded = false;
            }
        },
        show: function (i = 0) {
            var data = this.data(namespace);

            if (!data.modal.show) {
                if (data.modal.image) {
                    data.modal.image.remove();
                }
                data.modal.lightboxFrame.css({ "width": 240, "height": 180 })

                $("body").append(data.modal.contentBlocker);
                $("body").css("overflow", "hidden");

                data.modal.show = true;
                data.modal.imageIndex = i;

                data.modal.contentBlocker.fadeIn(200, function () {
                    data.modal.lightboxFrame.show().removeClass(data.settings.classes.hidden);
                });

                loadImage(data);

                data.modal.contentBlocker.on("click." + namespace, "." + data.settings.classes.closeButton, function (e) {
                    if (data.settings.onclose) {
                        data.settings.onclose(e);
                    }
                    if (!e.isDefaultPrevented()) {
                        methods.close.call(data.target);
                    }
                });

                data.modal.contentBlocker.on("dragstart." + namespace, "." + data.settings.classes.lightboxFrame +" img", function (e) {
                    e.preventDefault();
                });

                data.modal.contentBlocker.on(touchEventSettings.start + "." + namespace, "." + data.settings.classes.previousButton, function (e) {
                    e.stopPropagation();
                    methods.previous.call(data.target);
                });

                data.modal.contentBlocker.on(touchEventSettings.start + "." + namespace, "." +  data.settings.classes.nextButton, function (e) {
                    e.stopPropagation();
                    methods.next.call(data.target);
                });

                data.modal.contentBlocker.on(touchEventSettings.start + "." + namespace, "." + data.settings.classes.lightboxFrame, function (e) {
                    var startX = touchEventSettings.getX(e);
                    var pathX = 0;
                    var $this = $(this);

                    $this.on(touchEventSettings.move + "." + namespace, function (e) {
                        pathX += touchEventSettings.getX(e) - startX;
                        startX = touchEventSettings.getX(e);
                    });

                    $this.one(touchEventSettings.end + "." + namespace, function (e) {
                        $this.off(touchEventSettings.move + "." + namespace);

                        if (pathX < 0 && Math.abs(pathX) > threshold) {
                            methods.next.call(data.target);
                        } else if (pathX > 0 && pathX > threshold) {
                            methods.previous.call(data.target);
                        } else {
                            if (data.modal.arrowVisible) {
                                hideArrow(data);
                            } else {
                                showArrow(data, 6000);
                            }
                        }
                    });
                });
            }
        },
        next: function () {
            var data = this.data(namespace);
            if (data.modal.show && data.modal.imageLoaded && data.images.length > data.modal.imageIndex + 1) {
                hideArrow(data);
                data.modal.image.animate({ "opacity": 0 }, 400, function () {
                    data.modal.image[0].onload = null;
                    data.modal.image.remove();
                    data.modal.imageIndex++;

                    loadImage(data);
                });
            }
        },
        previous: function () {
            var data = this.data(namespace);
            if (data.modal.show && data.modal.imageLoaded && data.modal.imageIndex > 0) {
                hideArrow(data);
                data.modal.image.animate({ "opacity": 0 }, 400, function () {
                    data.modal.image[0].onload = null;
                    data.modal.image.remove();
                    data.modal.imageIndex--;

                    loadImage(data);
                });
            }
        }
    };
    $.fn.lightbox = function (method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist on ' + namespace);
        }
    };

})(jQuery);