/*jslint browser: true*/
/*jslint newcap: false*/
/*jslint nomen: true */
/*global $, _, jQuery, Backbone, console, alert, THREE */
/*jshint globalstrict: true*/

var SimCam = {
    "Template" : {},
    "Constructor" : {
        "Collection": {},
        "Model"  :    {},
        "View"   :    {},
        "Router" :    {}
    }
};

/*Model Constructors*/

SimCam.Constructor.Model.Generic = Backbone.Model.extend({});

/*Templates*/

SimCam.Template.MainFrame = '<iframe src="/iframes/environment.html" allowfullscreen="true" webkitallowfullscreen="true" mozallowfullscreen="true" allowfullscreen="true" webkitallowfullscreen="true" mozallowfullscreen="true" frameborder="0" class="simcam_iframe" width="100%" height="640px" ></iframe>';

SimCam.Template.SideMenu = {
    "pinhole" : '<h5>Pinhole Camera Model</h5>' +
                '<li class="nav-header">Field of View</li>' +
                '<li><a href="javascript:void(0)"><input type="text" name="fov" class="span1 pinhole_sidemenu_input"/></a></li>' +
                '<li class="nav-header">Sensor Size in Pixels</li>' +
                '<li><a href="javascript:void(0)">X: <input type="text" name="u" class="span1 pinhole_sidemenu_input"/></a></li>' +
                '<li><a href="javascript:void(0)">Y: <input type="text" name="v" class="span1 pinhole_sidemenu_input"/></a></li>' +
                '<li class="nav-header">Aspect Ratio</li>' +
                '<li><a href="javascript:void(0)"><input type="text" name="aspect_ratio" class="span1 pinhole_sidemenu_input"/></a></li>' +
                '<li><input type="button" class="btn btn-primary pinhole_sidemenu_apply_btn" value="Apply" /></li>',
    "matrix" : '<h5>Apply Matrix</h5>' +
                '<li><input type="button" class="btn btn-primary matrix_sidemenu_apply_btn" value="Apply" /></li>'

};


/*View Constructors*/
SimCam.Constructor.View.MainCanvas = Backbone.View.extend({
    initialize: function () {
        "use strict";
        var that = this;
        that.mouse =  new THREE.Vector2();
        that.offset = new THREE.Vector3();

        this.camera = new THREE.PerspectiveCamera(35, $(this.el).innerWidth() / window.innerHeight, 1, 10000);
        this.camera.position.set(65,65,65);

        this.controls = new THREE.OrbitControls( this.camera );
        this.controls.rotateSpeed = 1.0;
        this.controls.zoomSpeed = 1.2;
        this.controls.panSpeed = 0.8;
        this.controls.noZoom = false;
        this.controls.noPan = false;
        this.controls.staticMoving = true;
        this.controls.dynamicDampingFactor = 0.3;

        this.scene = new THREE.Scene();
        this.objects = $([]);

        this.scene.add( new THREE.AmbientLight( 0x505050 ) );

        var light = new THREE.SpotLight( 0xffffff, 1.5 );
        light.position.set( 0, 500, 2000 );
        light.castShadow = true;

        light.shadowCameraNear = 200;
        light.shadowCameraFar = this.camera.far;
        light.shadowCameraFov = 50;

        light.shadowBias = -0.00022;
        light.shadowDarkness = 0.5;

        light.shadowMapWidth = 2048;
        light.shadowMapHeight = 2048;
        this.lights = $([]);
        this.lights.push( light );

        this.scene.add( light );

        var jsonLoader = new THREE.JSONLoader();
        jsonLoader.load( "/3d_objs/camera.js", function( geometry ) {  

                var cam_obj = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { color: 0x2200cc } ) );

                cam_obj.material.ambient = cam_obj.material.color;

                cam_obj.position.set(0,0,15);

                cam_obj.scale.set(1,1,1);
                cam_obj.rotation.set( 0 ,0,  0 );
                console.log( that.options.app.models.camera );
                cam_obj.model = that.options.app.models.camera;
                //					cam_obj.castShadow = false;
                //					cam_obj.receiveShadow = false;
                var material = new THREE.MeshLambertMaterial({
map: THREE.ImageUtils.loadTexture("img/grid.gif")
});

                material.map.needsUpdate = true;

                var cube = new THREE.Mesh(
                    new THREE.CubeGeometry( 8, 5, 0.1 ),
                    material
                    );
                cube.model = that.options.app.models.grid;
                cube.model.trigger( 'init', cube.model, cube ); 
                cube.overdraw = true;
                that.scene.add( cube ); that.objects.push( cube );

                cube.position.set(0,0,0);

                that.scene.add( cam_obj );

                that.objects.push( cam_obj );
                cam_obj.model.trigger( 'init', cam_obj.model, cam_obj ); 


                } );

this.plane = new THREE.Mesh( new THREE.PlaneGeometry( 4000, 4000, 4, 4), new THREE.MeshBasicMaterial( { color: 0x000000, opacity: 0.25, transparent: true, wireframe: true } ) );
var xplane = new THREE.Mesh( new THREE.PlaneGeometry( 4000, 4000, 4, 4 ), new THREE.MeshBasicMaterial( { color: 0xCC0000, opacity: 0.25, transparent: true, wireframe: true } ) );
var yplane = new THREE.Mesh( new THREE.PlaneGeometry( 4000, 4000, 4, 4 ), new THREE.MeshBasicMaterial( { color: 0x00CC00, opacity: 0.25, transparent: true, wireframe: true } ) );
var zplane = new THREE.Mesh( new THREE.PlaneGeometry( 4000, 4000, 4, 4 ), new THREE.MeshBasicMaterial( { color: 0x0000CC, opacity: 0.25, transparent: true, wireframe: true } ) );

yplane.rotation.set( 0, 1.57079633, 0 );
zplane.rotation.set( 1.57079633, 0, 0 );


this.scene.add(xplane); this.scene.add(yplane); this.scene.add(zplane);

this.plane.visible = false;
this.scene.add(this.plane );

this.projector = new THREE.Projector();

this.renderer = new THREE.WebGLRenderer( { antialias: true, clearColor: 0x888888, clearAlpha: 255, canvas: this.$('canvas')[0]  } );
this.renderer.sortObjects = false;
this.renderer.setSize( $(this.el).innerWidth(), window.innerHeight );

this.renderer.shadowMapEnabled = true;
this.renderer.shadowMapSoft = true;

//this.el.appendChild(this.renderer.domElement );

/*
   renderer.domElement.addEventListener( 'mousemove', onDocumentMouseMove, false );
   renderer.domElement.addEventListener( 'mousedown', onDocumentMouseDown, false );
   renderer.domElement.addEventListener( 'mouseup', onDocumentMouseUp, false );


   window.addEventListener( 'resize', onWindowResize, false );
   */
$(window).on('resize', function() { that.on_resize(); } )
this.animate();
},
    events : {
       'mousemove canvas' : 'on_canvas_mmove',
       'mousedown canvas' : 'on_canvas_mdown',
       'mouseup canvas' : 'on_canvas_mup',
    },
    on_canvas_mmove : function( event ) {
                


				event.preventDefault();

			    this.mouse.x = ( event.clientX / $(this.el).innerWidth() ) * 2 - 1;
				this.mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

				//

				var vector = new THREE.Vector3( this.mouse.x, this.mouse.y, 0.5 );
				this.projector.unprojectVector( vector, this.camera );

				var ray = new THREE.Ray( this.camera.position, vector.subSelf( this.camera.position ).normalize() );


				if ( this.SELECTED ) {

					var intersects = ray.intersectObject( this.plane );
                    if( intersects[0] && intersects[0].point ) {
                        if( event.shiftKey )
                        {
                            var loc =  intersects[ 0 ].point.subSelf( this.offset ); 
                            var vector = new THREE.Vector3(0,0,0);

                            vector.sub( this.SELECTED.position, loc );

                                                // Direction we are already facing (without rotation)
                    var forward = new THREE.Vector3(0,0,-1);

                    // Direction we want to be facing (towards mouse pointer)
                    var target = vector.normalize();

                    // Axis and angle of rotation
                    var axis = new THREE.Vector3().cross(forward, target);
                    var sinAngle = axis.length(); // |u x v| = |u|*|v|*sin(a)
                    var cosAngle = forward.dot(target); // u . v = |u|*|v|*cos(a)
                    var angle = Math.atan2(sinAngle, cosAngle); // atan2(sin(a),cos(a)) = a
                    axis.normalize();
                   
                    var a = new THREE.Mesh();
                    a.useQuaternion = true;
                    a.quaternion.setFromAxisAngle(axis, angle);
                        this.SELECTED.rotation.set( a.quaternion.x, a.quaternion.y, a.quaternion.z );
                        this.SELECTED.rotation.multiplyScalar( 0.5 );
       
                        }
                        else {
					       this.SELECTED.position.copy( intersects[ 0 ].point.subSelf( this.offset ) );
                        }
                        this.SELECTED.model.trigger( 'move', this.SELECTED.model, this.SELECTED );
                    }
					return;

				}


				var intersects = ray.intersectObjects( this.objects );

				if ( intersects.length > 0 ) {

					if ( this.INTERSECTED != intersects[ 0 ].object ) {

						if ( this.INTERSECTED ) this.INTERSECTED.material.color.setHex( this.INTERSECTED.currentHex );

						this.INTERSECTED = intersects[ 0 ].object;
						this.INTERSECTED.currentHex = this.INTERSECTED.material.color.getHex();

						this.plane.position.copy( this.INTERSECTED.position );
						this.plane.lookAt( this.camera.position );
                        this.plane.rotation.copy( this.camera.rotation );

					}

				    this.el.style.cursor = 'pointer';

				} else {

					if ( this.INTERSECTED ) this.INTERSECTED.material.color.setHex( this.INTERSECTED.currentHex );

					this.INTERSECTED = null;

					this.el.style.cursor = 'auto';

				}


    },
    on_canvas_mdown : function(event ) {

				event.preventDefault();

				var vector = new THREE.Vector3( this.mouse.x, this.mouse.y, 0.5 );
				this.projector.unprojectVector( vector, this.camera );

				var ray = new THREE.Ray( this.camera.position, vector.subSelf( this.camera.position ).normalize() );

				var intersects = ray.intersectObjects( this.objects );

				if ( intersects.length > 0 ) {

					this.controls.enabled = false;

					this.SELECTED = intersects[ 0 ].object;

					var intersects = ray.intersectObject( this.plane );
					this.offset.copy( intersects[ 0 ].point ).subSelf( this.plane.position );

					this.el.style.cursor = 'move';

				}


    },
    on_canvas_mup : function(event ) {
				event.preventDefault();

				this.controls.enabled = true;

				if ( this.INTERSECTED ) {

					this.plane.position.copy( this.INTERSECTED.position );

					this.SELECTED = null;

				}

				this.el.style.cursor = 'auto';

    },
    on_resize : function (event ) {

				this.camera.aspect = $(this.el).innerWidth() / window.innerHeight;
				this.camera.updateProjectionMatrix();

				this.renderer.setSize( $(this.el).innerWidth(), window.innerHeight );


    },
    animate : function () {
                var that = this; 
				requestAnimationFrame( function() { that.animate() } );
				this.render();
    }, 
    render : function () {

				this.controls.update();

				this.renderer.render( this.scene, this.camera );


    }
});

SimCam.Constructor.View.SideCanvas = Backbone.View.extend({
    initialize: function (options) {
        "use strict";

    }

});


SimCam.Constructor.View.SideMenu = Backbone.View.extend({
    initialize: function (options) {
        "use strict";
        var that;
        that = this;
        that.app = options.app;
        that.render(options.mode);
    },
    events : {
    },
    render: function (mode) {
        "use strict";
        var that, template;
        that = this;
        template = SimCam.Template.SideMenu[mode.type];
        if (template === undefined) {
            template = 'Sidemenu template not implemented for: ' + mode.type;
        }
        that.$('.body').html(template);

    }
});

SimCam.Constructor.View.BottomBarImage = Backbone.View.extend({
    initialize: function (options) {
        "use strict";

    }
});

SimCam.Constructor.View.BottomBar = Backbone.View.extend({
    initialize: function (options) {
        "use strict";

    }
});

SimCam.Constructor.View.Main = Backbone.View.extend({
    initialize: function (options) {
        "use strict";
        var that, main_viewer_frame, camera_viewer_frame, mv_body, cv_body, side_el, bottom_el, popovers;
        that = this;

        that.mode = options.mode;
        main_viewer_frame = that.$('#main_viewer');
        camera_viewer_frame = that.$('#camera_viewer');

        mv_body = $(main_viewer_frame[0].contentDocument).find('body');
        cv_body = $(camera_viewer_frame[0].contentDocument).find('body');

        bottom_el = that.$('.bottom_bar');
        side_el   = that.$('.sidemenu');

        that.bottom_bar_viewer = new SimCam.Constructor.View.BottomBar({ el: bottom_el, mode: that.mode, app: options.app });
        that.side_bar_viewer   = new SimCam.Constructor.View.SideMenu({ el: side_el, mode: that.mode, app: options.app });

        that.main_viewer       = new SimCam.Constructor.View.MainCanvas({ el: mv_body, mode: that.mode, app: options.app });
        that.camera_viewer     = new SimCam.Constructor.View.SideCanvas({ el: cv_body, mode: that.mode, app: options.app });

        main_viewer_frame.on('load', function () { that.main_viewer.trigger('load'); });
        camera_viewer_frame.on('load', function () { that.camera_viewer.trigger('load'); });

        if (that.mode.learning_environment) {
            popovers = that.$('[data-toggle="popover"]');
            popovers.popover({ html: true});
            popovers.popover('toggle');
        }

    },
    events: {
        'load' : 'on_load',
        'click .close_popover' : 'on_click_close_popover'
    },
    on_load : function () {
        "use strict";

    },
    on_click_close_popover: function (e) {
        "use strict";
        var that, cur_target, rel_data_toggle;
        that = this;
        cur_target = $(e.currentTarget);

        rel_data_toggle = $(cur_target.parents('.popover').prevAll('[data-toggle="popover"]')[0]);
        rel_data_toggle.popover('toggle');
    },
    render : function () {
        "use strict";
        var that;
        that = this;

    }
});


/*Router Constuctor*/
SimCam.Constructor.Router.App = Backbone.Router.extend({
    version : 0.01,
    initialize: function (options) {
        "use strict";
        var that, env_frame, env_frame_body;
        that = this;

        that.element = options.element;

        that.models = { camera: new SimCam.Constructor.Model.Generic(), grid: new SimCam.Constructor.Model.Generic() };

        env_frame = $(SimCam.Template.MainFrame);

        env_frame.load(function () { that.on_env_frame_load(options, env_frame); });

        that.element.append(env_frame);

    },
    routes: {
	    '': 'default_route'
    },
    //ROUTES
    default_route : function () {
        "use strict";
        var that;
        that = this;
    },
    //EVENTS 
    on_env_frame_load : function (options, env_frame) {
        "use strict";
        var that, env_frame_body;
        that = this;
        env_frame_body = $(env_frame[0].contentDocument).find('body');

        that.view = new SimCam.Constructor.View.Main({ el : env_frame_body, mode: options.mode, app: that });
	    that.view.render();


    }
});


SimCam.initialize = function (options) {
    "use strict";
    var app;
    app = new SimCam.Constructor.Router.App(options);
    Backbone.history.start();
};

