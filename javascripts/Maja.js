(function($) {
	window.Footer = Backbone.Model.extend({
		"url": "/assets/footer.json"
	});

	window.FlickrPhotoset = Backbone.Model.extend({});

	window.Photosets = Backbone.Model.extend({
		url: 'http://api.flickr.com/services/rest/?method=flickr.photosets.getList&format=json&api_key=MY_API_KEY_HERE&user_id=MY_USER_ID_HERE&nojsoncallback=1',
		photosPerSet: [],
		initialize: function() {
			_.bindAll(this, 'getId', 'getSize', 'fetchPhotos', 'getTitle', 'getDescription');

			this.bind('change', this.fetchPhotos);
		},
		getId: function(index) {
			return this.attributes.photosets.photoset[index].id;
		},
		getTitle: function(index) {
			return this.attributes.photosets.photoset[index].title._content;
		},
		getDescription: function(index) {
			return this.attributes.photosets.photoset[index].description._content;
		},
		getSize: function() {
			return this.attributes.photosets.photoset.length;
		},
		fetchPhotos: function() {
			for (i = 0; i < this.getSize(); i++) {
				this.photosPerSet.push(new window.PhotosOfPhotoset({
					setTitle: this.getTitle(i),
					setDescription: this.getDescription(i)
				}));

				this.photosPerSet[i].setPhotoSetId(this.getId(i));
				if (i === (this.getSize() - 1)) {
					this.photosPerSet[i].setLast(true);
				}
				this.photosPerSet[i].fetch();
			}
		}
	});

	window.PhotosOfPhotoset = Backbone.Model.extend({
		last: false,
		photosetId: 0,
		initialize: function() {
			_.bindAll(this, 'url', 'setPhotoSetId', 'getSize', 'getPhotoUrl', 'update', 'setLast', 'getPhotoTitle');
			this.bind('change', this.update);
		},
		url: function() {
			return 'http://api.flickr.com/services/rest/?method=flickr.photosets.getPhotos&format=json&api_key=beda8cbda2554c1da125362dcf86eab2&user_id=79009288@N07&photoset_id=' + this.photosetId + '&extras=url_l&nojsoncallback=1';
		},
		setLast: function(isLast) {
			this.last = isLast;
		},
		setPhotoSetId: function(newId) {
			this.photosetId = newId;
		},
		getSize: function() {
			if (this.attributes.photoset) {
				return this.attributes.photoset.photo.length;
			} else {
				return 0;
			}
		},
		getPhotoTitle: function(index) {
			return this.attributes.photoset.photo[index].title;
		},
		getPhotoUrl: function(index) {
			return this.attributes.photoset.photo[index].url_l;
		},
		update: function() {
			var projectCache = {
				id: this.photosetId,
				title: this.attributes.setTitle,
				description: this.attributes.setDescription,
				images: []
			};

			for (k = 0; k < this.getSize(); k++) {
				projectCache.images.push({
					id: k,
					title: this.getPhotoTitle(k),
					description: this.attributes.setDescription,
					url: this.getPhotoUrl(k)
				});
			}
			window.projectItems.push(new SelectableItem(projectCache));
		}
	});

	window.TextSection = Backbone.Model.extend({});

	window.ResumeSection = Backbone.Model.extend({});

	window.Resume = Backbone.Collection.extend({
		model: ResumeSection,
		url: '/assets/resume.json'
	});

	window.Writings = Backbone.Collection.extend({
		model: TextSection,
		url: '/assets/writings.json'
	});

	window.SelectableItem = Backbone.Model.extend({
		selected: false,
		initialize: function() {
			_.bindAll(this, 'select', 'unSelect', 'isSelected');
		},
		select: function() {
			this.selected = true;
			this.trigger('change');
			this.trigger('select');
		},
		unSelect: function() {
			this.selected = false;
			this.trigger('change');
			this.trigger('unSelect');
		},
		isSelected: function() {
			return this.selected;
		}
	});

	window.SelectableItems = Backbone.Collection.extend({
		model: SelectableItem
	});

	window.ProjectItems = SelectableItems.extend({
		comparator: function(o1, o2) {
			return o1.attributes.id < o2.attributes.id;
		}
	});

	window.SelectableModel = Backbone.Model.extend({
		currentItemIndex: 0,
		initialize: function() {
			_.bindAll(this, 'select', 'getcurrentItemIndex', 'getItems', 'next', 'previous');
			this.bind('select', this.select);
			this.bind('change', this.selectFirst);

			this.items = this.attributes.items;
		},
		select: function(item) {
			if (item.attributes.url) {
				window.open(item.attributes.url, '_blank');
			} else {
				this.items.at(this.getcurrentItemIndex()).unSelect();
				item.select();
				this.currentItemIndex = this.items.indexOf(item);
				this.trigger('selected', this.currentItemIndex);
			}
		},
		getcurrentItemIndex: function() {
			return this.currentItemIndex;
		},
		getItems: function() {
			return this.items;
		},
		next: function() {
			if (this.getcurrentItemIndex() !== (this.items.size() - 1)) {
				this.select(this.items.at(this.getcurrentItemIndex() + 1));
			} else {
				this.select(this.items.first());
			}
		},
		previous: function() {
			if (this.getcurrentItemIndex() !== 0) {
				this.select(this.items.at(this.getcurrentItemIndex() - 1));
			} else {
				this.select(this.items.last());
			}
		}
	});

	window.resume = new Resume();

	window.toolbarItems = new SelectableItems();
	window.toolbarItems.url = '/assets/toolbar.json';
	window.toolbar = new SelectableModel({
		items: window.toolbarItems
	});

	window.projectItems = new ProjectItems();

	window.projectSelector = new SelectableModel({
		items: window.projectItems
	});

	window.writingItems = new SelectableItems();
	window.writingItems.url = '/assets/writings.json';
	window.writings = new SelectableModel({
		items: window.writingItems
	});

	$(document).ready(function() {
		window.ToolbarItemView = Backbone.View.extend({
			tag: 'div',
			className: 'maja-navigation-toolbar-item',
			events: {
				'click .toolbar-click-item': 'select'
			},
			initialize: function() {
				_.bindAll(this, 'render', 'select');
				this.bind('select', this.render);
				this.model.bind('change', this.render);
				this.template = _.template($('#maja_toolbar_item_template').html());
				this.toolbar = this.options.toolbar;
			},
			render: function() {
				var renderedContent = this.template(this.model.toJSON());
				$(this.el).html(renderedContent);

				if (this.model.selected) {
					$(this.el).addClass('maja-navigation-toolbar-selected');
				} else if ($(this.el).hasClass('maja-navigation-toolbar-selected')) {
					$(this.el).removeClass('maja-navigation-toolbar-selected');
				}
				return this;
			},
			select: function() {
				this.toolbar.trigger('select', this.model);
			}
		});

		window.ToolbarView = Backbone.View.extend({
			initialize: function() {
				_.bindAll(this, 'render');
				this.toolbar = this.options.toolbar;

				this.toolbar.getItems().bind('reset', this.render);
				this.toolbar.getItems().bind('change', this.render);
			},
			render: function() {
				var $itemsRoot, toolbar = this.toolbar,
					collection = this.toolbar.getItems();

				$itemsRoot = $('#toolbar');
				$itemsRoot.empty();
				collection.each(function(toolbarItem) {
					var view = new ToolbarItemView({
						model: toolbarItem,
						toolbar: toolbar
					});
					$itemsRoot.append(view.render().el);
				});
				return this;
			}
		});

		window.ProjectItemView = Backbone.View.extend({
			tag: 'div',
			className: 'maja-gallery-item',
			events: {
				'click .maja_project_gallery_item_title': 'select',
				'click div.gv_gallery': 'select'
			},
			initialize: function() {
				_.bindAll(this, 'render', 'select', 'update');

				this.bind('select', this.update);
				this.model.bind('change', this.update);

				this.template = _.template($('#maja_project_template').html());
				this.imageTemplate = _.template($('#maja_project_image_template').html());
				this.gallery = this.options.gallery;
				this.toolbar = this.options.toolbar;

				this.galleryViewConfig = {
					transition_speed: 2000,
					//INT - duration of panel/frame transition (in milliseconds)
					transition_interval: 4000,
					//INT - delay between panel/frame transitions (in milliseconds)
					easing: 'swing',
					//STRING - easing method to use for animations (jQuery provides 'swing' or 'linear', more available with jQuery UI or Easing plugin)
					show_panels: true,
					//BOOLEAN - flag to show or hide panel portion of gallery
					show_panel_nav: true,
					//BOOLEAN - flag to show or hide panel navigation buttons
					enable_overlays: false,
					//BOOLEAN - flag to show or hide panel overlay
					panel_width: 250,
					//INT - width of gallery panel (in pixels)
					panel_height: 250,
					//INT - height of gallery panel (in pixels)
					panel_animation: 'slide',
					//STRING - animation method for panel transitions (crossfade,fade,slide,none)
					panel_scale: 'crop',
					//STRING - cropping option for panel images (crop = scale image and fit to aspect ratio determined by panel_width and panel_height, fit = scale image and preserve original aspect ratio)
					overlay_position: 'bottom',
					//STRING - position of panel overlay (bottom, top)
					pan_images: true,
					//BOOLEAN - flag to allow user to grab/drag oversized images within gallery
					pan_style: 'drag',
					//STRING - panning method (drag = user clicks and drags image to pan, track = image automatically pans based on mouse position
					pan_smoothness: 15,
					//INT - determines smoothness of tracking pan animation (higher number = smoother)
					start_frame: 1,
					//INT - index of panel/frame to show first when gallery loads
					show_filmstrip: false,
					//BOOLEAN - flag to show or hide filmstrip portion of gallery
					show_filmstrip_nav: false,
					//BOOLEAN - flag indicating whether to display navigation buttons
					enable_slideshow: false,
					//BOOLEAN - flag indicating whether to display slideshow play/pause button
					autoplay: false,
					//BOOLEAN - flag to start slideshow on gallery load
					show_captions: false,
					//BOOLEAN - flag to show or hide frame captions	
					filmstrip_size: 3,
					//INT - number of frames to show in filmstrip-only gallery
					filmstrip_style: 'scroll',
					//STRING - type of filmstrip to use (scroll = display one line of frames, scroll filmstrip if necessary, showall = display multiple rows of frames if necessary)
					filmstrip_position: 'bottom',
					//STRING - position of filmstrip within gallery (bottom, top, left, right)
					frame_width: 60,
					//INT - width of filmstrip frames (in pixels)
					frame_height: 30,
					//INT - width of filmstrip frames (in pixels)
					frame_opacity: 0.5,
					//FLOAT - transparency of non-active frames (1.0 = opaque, 0.0 = transparent)
					frame_scale: 'crop',
					//STRING - cropping option for filmstrip images (same as above)
					frame_gap: 5,
					//INT - spacing between frames within filmstrip (in pixels)
					show_infobar: false,
					//BOOLEAN - flag to show or hide infobar
					infobar_opacity: 1 //FLOAT - transparency for info bar
				};

			},
			render: function() {
				var renderedContent = this.template(this.model.toJSON());

				$(this.el).html(renderedContent);

				if (this.model.selected) {
					$(this.el).addClass('maja-gallery-item-selected');
				} else if ($(this.el).hasClass('maja-gallery-item-selected')) {
					$(this.el).removeClass('maja-gallery-item-selected');
				}

				$projectImagesRoot = $(this.el).find('#maja_gallery_minimized_' + this.model.id);
				$projectImagesRoot.empty();
				$projectImagesRoot.append(this.imageTemplate(this.model.toJSON()));

				var gv = $projectImagesRoot.galleryView(this.galleryViewConfig);
				
				$('.gv_panel > img').on('click', gv.showNext);

				new ProjectDetailView({
					model: this.model,
					toolbar: this.toolbar,
					gallery: this.gallery
				}).render();

				return this;
			},
			update: function() {
				if (this.model.selected) {
					$(this.el).addClass('maja-gallery-item-selected');
				} else if ($(this.el).hasClass('maja-gallery-item-selected')) {
					$(this.el).removeClass('maja-gallery-item-selected');
				}
			},
			select: function() {
				this.gallery.trigger('select', this.model);
			}
		});

		window.ProjectView = Backbone.View.extend({
			initialize: function() {
				_.bindAll(this, 'render', 'toggle', 'show', 'hide');

				this.gallery = this.options.gallery;
				this.gallery.getItems().bind('reset', this.render);
				this.gallery.getItems().bind('add', this.render);

				this.gallery.getItems().bind('select', this.hide);

				this.galleryTemplate = _.template($('#maja_project_gallery_template').html());

				this.selectedIndex = 0;

				this.toolbar = this.options.toolbar;
				this.toolbar.bind('selected', this.render);

				this.toolbar.bind('selected', this.toggle);
			},
			render: function() {
				if (this.toolbar.getcurrentItemIndex() === this.selectedIndex) {
					var $contentRoot = $('#content');
					$contentRoot.empty();
					$contentRoot.append(this.galleryTemplate());

					var $itemsRoot, gallery = this.gallery,
						collection = this.gallery.getItems();
					toolbar = this.toolbar;

					$itemsRoot = $contentRoot.find('#maja_project_gallery');
					$itemsRoot.empty();
					collection.each(function(item) {
						var view = new ProjectItemView({
							model: item,
							gallery: gallery,
							toolbar: toolbar
						});
						$itemsRoot.append(view.render().el);
					});
				}
				return this;
			},
			toggle: function(selectedItemIndex) {
				if (selectedItemIndex === this.selectedIndex) {
					this.show();
				} else {
					this.hide();
				}
			},
			show: function() {
				$('#maja_project_gallery').show();
			},
			hide: function() {
				$('#maja_project_gallery').hide();
			}
		});

		window.ProjectDetailView = Backbone.View.extend({
			initialize: function() {
				_.bindAll(this, 'render', 'show', 'hide', 'next', 'previous');

				this.selectedIndex = 0;

				this.model.bind('select', this.show);
				this.model.bind('unSelect', this.hide);

				this.template = _.template($('#maja_gallery_detail_template').html());
				this.imageTemplate = _.template($('#maja_project_image_template').html());
				this.gallery = this.options.gallery;

				this.toolbar = this.options.toolbar;
				this.toolbar.bind('selected', this.hide);

				this.galleryViewConfig = {
					transition_speed: 2000,
					//INT - duration of panel/frame transition (in milliseconds)
					transition_interval: 4000,
					//INT - delay between panel/frame transitions (in milliseconds)
					easing: 'swing',
					//STRING - easing method to use for animations (jQuery provides 'swing' or 'linear', more available with jQuery UI or Easing plugin)
					show_panels: true,
					//BOOLEAN - flag to show or hide panel portion of gallery
					show_panel_nav: true,
					//BOOLEAN - flag to show or hide panel navigation buttons
					enable_overlays: true,
					//BOOLEAN - flag to show or hide panel overlays
					panel_width: 1024,
					//INT - width of gallery panel (in pixels)
					panel_height: 600,
					//INT - height of gallery panel (in pixels)
					panel_animation: 'fade',
					//STRING - animation method for panel transitions (crossfade,fade,slide,none)
					panel_scale: 'fit',
					//STRING - cropping option for panel images (crop = scale image and fit to aspect ratio determined by panel_width and panel_height, fit = scale image and preserve original aspect ratio)
					overlay_position: 'bottom',
					//STRING - position of panel overlay (bottom, top)
					pan_images: true,
					//BOOLEAN - flag to allow user to grab/drag oversized images within gallery
					pan_style: 'drag',
					//STRING - panning method (drag = user clicks and drags image to pan, track = image automatically pans based on mouse position
					pan_smoothness: 15,
					//INT - determines smoothness of tracking pan animation (higher number = smoother)
					start_frame: 1,
					//INT - index of panel/frame to show first when gallery loads
					show_filmstrip: true,
					//BOOLEAN - flag to show or hide filmstrip portion of gallery
					show_filmstrip_nav: true,
					//BOOLEAN - flag indicating whether to display navigation buttons
					enable_slideshow: false,
					//BOOLEAN - flag indicating whether to display slideshow play/pause button
					autoplay: false,
					//BOOLEAN - flag to start slideshow on gallery load
					show_captions: true,
					//BOOLEAN - flag to show or hide frame captions	
					filmstrip_size: 3,
					//INT - number of frames to show in filmstrip-only gallery
					filmstrip_style: 'scroll',
					//STRING - type of filmstrip to use (scroll = display one line of frames, scroll filmstrip if necessary, showall = display multiple rows of frames if necessary)
					filmstrip_position: 'bottom',
					//STRING - position of filmstrip within gallery (bottom, top, left, right)
					frame_width: 164,
					//INT - width of filmstrip frames (in pixels)
					frame_height: 80,
					//INT - width of filmstrip frames (in pixels)
					frame_opacity: 0.7,
					//FLOAT - transparency of non-active frames (1.0 = opaque, 0.0 = transparent)
					frame_scale: 'crop',
					//STRING - cropping option for filmstrip images (same as above)
					frame_gap: 5,
					//INT - spacing between frames within filmstrip (in pixels)
					show_infobar: true,
					//BOOLEAN - flag to show or hide infobar
					infobar_opacity: 1 //FLOAT - transparency for info bar
				};
			},
			render: function() {
				var renderedContent = this.template(this.model.toJSON());
				$contentRoot = $('#maja_project_gallery_detail');
				$contentRoot.append(renderedContent);

				$projectImagesRoot = $contentRoot.find('#maja_gallery_detail_images_' + this.model.id);
				$projectImagesRoot.empty();
				$projectImagesRoot.append(this.imageTemplate(this.model.toJSON()));

				this.gv = $projectImagesRoot.galleryView(this.galleryViewConfig);

				$detailRoot = $contentRoot.find('#maja_gallery_detail_panel_' + this.model.id);
				$detailRoot.find('.maja-gallery-detail-nav.maja-gallery-detail-right-nav').on('click', this.next);
				$detailRoot.find('.maja-gallery-detail-nav.maja-gallery-detail-left-nav').on('click', this.previous);

				$detailRoot.hide();

				return this;
			},
			show: function() {
				$('#maja_gallery_detail_panel_' + this.model.id).show();
			},
			hide: function() {
				$('#maja_gallery_detail_panel_' + this.model.id).hide();
			},
			next: function() {
				this.gallery.next();
			},
			previous: function() {
				this.gallery.previous();
			}
		});

		window.ResumeView = Backbone.View.extend({
			initialize: function() {
				_.bindAll(this, 'render', 'toggle', 'show', 'hide');
				this.selectedIndex = 2;
				this.template = _.template($('#maja_resume_template').html());
				this.toolbar = this.options.toolbar;
				this.toolbar.bind('selected', this.render);

				this.toolbar.bind('selected', this.toggle);

				this.resume = this.options.resume;
				this.resume.bind('reset', this.render);
			},
			render: function() {
				if (this.toolbar.getcurrentItemIndex() === this.selectedIndex) {
					var $contentRoot = $('#content');
					$contentRoot.empty();
					$contentRoot.append(this.template());

					$resumeRoot = $contentRoot.find('#maja_resume');

					collection = this.resume;

					collection.each(function(item) {
						var view = new ResumeSectionView({
							model: item,
							toolbar: toolbar,
							collection: collection
						});
						$resumeRoot.append(view.render().el);
					});

					this.hide();
				}
				return this;
			},
			toggle: function(selectedItemIndex) {
				if (selectedItemIndex === this.selectedIndex) {
					this.show();
				} else {
					this.hide();
				}
			},
			show: function() {
				$('#maja_resume').show();
			},
			hide: function() {
				$('#maja_resume').hide();
			}
		});

		window.ResumeSectionView = Backbone.View.extend({
			className: 'maja-resume-section',
			initialize: function() {
				_.bindAll(this, 'render');

				this.collection = this.options.collection;
				this.template = _.template($('#maja_resume_section_template').html());

			},
			render: function() {
				var renderedContent = this.template(this.model.toJSON());
				$(this.el).html(renderedContent);

				if (this.collection.first() === this.model) {
					$(this.el).addClass('maja-resume-section-first');
				}
				if (this.collection.last() === this.model) {
					$(this.el).addClass('maja-resume-section-last');
				}

				return this;
			}
		});

		window.WritingItemView = Backbone.View.extend({
			initialize: function() {
				_.bindAll(this, 'render', 'expand', 'contract', 'update', 'select');
				this.template = _.template($('#maja_writings_item_template').html());
				this.model.bind('select', this.expand);
				this.model.bind('unSelect', this.contract);

				this.writings = this.options.writings;
				this.collection = this.options.collection;
			},
			render: function() {
				var renderedContent = this.template(this.model.toJSON());
				$(this.el).html(renderedContent);

				$(this.el).find('.maja-writings-sneak-peek').on('click', this.select);

				this.contract();

				return this;
			},
			update: function() {
				if (this.model.selected) {
					this.expand();
				} else {
					this.contract();
				}
			},
			expand: function() {
				$(this.el).find('.maja-writings-paragraph').show();
				$(this.el).find('.maja-writings-sneak-peek').removeClass('hover');
				$(this.el).find('.maja-writings-sneak-peek > span').remove();
			},
			contract: function() {
				$(this.el).find('.maja-writings-paragraph').hide();
				$(this.el).find('.maja-writings-sneak-peek').addClass('hover');
				$(this.el).find('.maja-writings-sneak-peek').append('<span>..</span>');
			},
			select: function() {
				this.writings.trigger('select', this.model);
			}
		});

		window.WritingsView = Backbone.View.extend({
			initialize: function() {
				_.bindAll(this, 'render', 'toggle', 'show', 'hide');
				this.selectedIndex = 1;
				this.template = _.template($('#maja_writings_template').html());

				this.toolbar = this.options.toolbar;
				this.toolbar.bind('selected', this.render);
				this.toolbar.bind('selected', this.toggle);

				this.writings = this.options.writings;
				this.writings.bind('reset', this.render);
			},
			render: function() {
				if (this.toolbar.getcurrentItemIndex() === this.selectedIndex) {

					var $contentRoot = $('#content');
					$contentRoot.empty();

					$contentRoot.append(this.template());

					$writingsRoot = $contentRoot.find('#maja_writings');

					collection = this.writings;

					collection.each(function(item) {
						var view = new WritingItemView({
							model: item,
							writings: writings,
							collection: collection
						});
						$writingsRoot.append(view.render().el);
					});

					this.hide();
				}
				return this;
			},
			toggle: function(selectedItemIndex) {
				if (selectedItemIndex === this.selectedIndex) {
					this.show();
				} else {
					this.hide();
				}
			},
			show: function() {
				$('#maja_writings').show();
			},
			hide: function() {
				$('#maja_writings').hide();
			}
		});

		window.Maja = Backbone.Router.extend({
			routes: {
				'': 'home'
			},
			initialize: function() {
				window.projects = [];
				
 if ( window.XDomainRequest && !jQuery.support.cors ) {
	jQuery.ajaxTransport(function( s ) {
		if ( s.crossDomain && s.async ) {
			if ( s.timeout ) {
				s.xdrTimeout = s.timeout;
				delete s.timeout;
			}
			var xdr;
			return {
				send: function( _, complete ) {
					function callback( status, statusText, responses, responseHeaders ) {
						xdr.onload = xdr.onerror = xdr.ontimeout = xdr.onprogress = jQuery.noop;
						xdr = undefined;
						jQuery.event.trigger( "ajaxStop" );
						complete( status, statusText, responses, responseHeaders );
					}
					xdr = new XDomainRequest();
					xdr.open( s.type, s.url );
					xdr.onload = function() {
						var status = 200;
						var message = xdr.responseText;
						var r = JSON.parse(xdr.responseText);
						if (r.StatusCode && r.Message) {
							status = r.StatusCode;
							message = r.Message;
						}
						callback( status , message, { text: message }, "Content-Type: " + xdr.contentType );
					};
					xdr.onerror = function() {
						callback( 500, "Unable to Process Data" );
					};
					xdr.onprogress = function() {};
					if ( s.xdrTimeout ) {
						xdr.ontimeout = function() {
							callback( 0, "timeout" );
						};
						xdr.timeout = s.xdrTimeout;
					}
					xdr.send( ( s.hasContent && s.data ) || null );
				},
				abort: function() {
					if ( xdr ) {
						xdr.onerror = jQuery.noop();
						xdr.abort();
					}
				}
			};
		}
	});  
}
				window.toolbarItems.fetch({
					success: function(collection, response) {
						collection.at(0).select();
					}
				});

				this.toolbar = new ToolbarView({
					toolbar: window.toolbar
				});

				window.photosets = new Photosets();
				window.photosets.fetch({error: function(model, reponse){
					alert('peep');
				}});

				window.writingItems.fetch();

				window.resume.fetch();

				window.projectView = new ProjectView({
					gallery: window.projectSelector,
					toolbar: window.toolbar
				});

				this.resumeView = new ResumeView({
					toolbar: window.toolbar,
					resume: window.resume
				});

				this.writingsView = new WritingsView({
					toolbar: window.toolbar,
					writings: window.writingItems
				});
				this.footer = new Footer();
				this.footer.fetch({
					success: function(model, response) {
						$footer = $('#footer');
						var template = _.template($('#maja_footer_template').html());
						$footer.append(template(model.toJSON()));
						$footer.find('#footer-right').append(window.twittr.widgetEl);
						$footer.find('.twtr-hd').hide();
					}
				});
			},
			home: function() {
				var $container = $('#toolbar');
				$container.empty();
				$container.append(this.toolbar.render().el);
			}
		});

		$(function() {
			window.App = new Maja();
			Backbone.history.start();
		});
	});
})(jQuery);