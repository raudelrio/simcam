/*jslint browser: true*/
/*jslint newcap: false*/
/*jslint nomen: true */
/*global $, _, jQuery, Backbone, console, alert, THREE, requestAnimationFrame, Base64Binary */
/*jshint globalstrict: true*/

/**TODO:
 * Template for Calibration
 * Making 
 *
 */

var SimCam = {
    "Version"  : 0.001,
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

/*Collection Contructors*/
SimCam.Constructor.Collection.Generic = Backbone.Collection.extend({});

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
                '<li><a href="javascript:void(0)"><input type="text" name="aspect" class="span1 pinhole_sidemenu_input"/></a></li>' +
                '<li class="nav-header">Far</li>' +
                '<li><a href="javascript:void(0)"><input type="text" name="far" class="span1 pinhole_sidemenu_input" disabled="true" /></a></li>' +
                '<li class="nav-header">Near</li>' +
                '<li><a href="javascript:void(0)"><input type="text" name="near" class="span1 pinhole_sidemenu_input" disabled="true" /></a></li>',
    "distortions" : '<h5>Distortions</h5>' +
                '<li class="nav-header">Radial Distortions</li>' +
                '<li><a href="javascript:void(0)">R1: <input type="text" name="r1" class="span1 distortions_sidemenu_input"/></a></li>' +
                '<li><a href="javascript:void(0)">R2: <input type="text" name="r2" class="span1 distortions_sidemenu_input"/></a></li>' +
                '<li><a href="javascript:void(0)">R3: <input type="text" name="r3" class="span1 distortions_sidemenu_input"/></a></li>' +
                '<li class="nav-header">Tangential Distortions</li>' +
                '<li><a href="javascript:void(0)">TX: <input type="text" name="t1" class="span1 distortions_sidemenu_input"/></a></li>' +
                '<li class="nav-header">Far</li>' +
                '<li><a href="javascript:void(0)">TY: <input type="text" name="t2" class="span1 distortions_sidemenu_input" /></a></li>',
    "calibration" : '<li class="nav-header">Calibration</li>' +
                '<li><input type="button" name="capture" class="btn btn_primary calibration_sidemenu_input" value="Capture Image" /></li>' +
                '<li class="nav-header"> </li>' +
                '<li><input type="button" name="calibrate" class="btn btn_primary calibration_sidemenu_input" value="Calibrate" /></li>' +
                '<li class="nav-header"> </li>' +
                '<li><input type="button" name="results" class="btn btn_primary calibration_sidemenu_input" value="View Current Results" /></li>',
    "matrix" : '<h5>Apply Matrix</h5>' +
                '<li><input type="button" class="btn btn-primary matrix_sidemenu_apply_btn" value="Apply" /></li>'

};


/*View Constructors*/
SimCam.Constructor.View.MainCanvas = Backbone.View.extend({
    initialize: function (options) {
        "use strict";
        var that, light, jsonLoader, xplane, yplane, zplane;
        that = this;

        that.bind('rendered', function () { if (options.render_cb) { options.render_cb(this); } }, that);
        that.mouse =  new THREE.Vector2();
        that.offset = new THREE.Vector3();

        that.camera = new THREE.PerspectiveCamera(35, that.$el.innerWidth() / that.$el.innerHeight(), 1, 10000);
        that.camera.position.set(45, 45, 45);

        that.controls = new THREE.OrbitControls(that.camera, that.$('canvas')[0]);
        that.controls.rotateSpeed = 1.0;
        that.controls.zoomSpeed = 1.2;
        that.controls.panSpeed = 0.8;
        that.controls.noZoom = false;
        that.controls.noPan = false;
        that.controls.staticMoving = true;
        that.controls.dynamicDampingFactor = 0.3;

        that.scene = new THREE.Scene();
        that.objects = $([]);

        that.scene.add(new THREE.AmbientLight(0x505050));

        light = new THREE.SpotLight(0xffffff, 1.5);
        light.position.set(0, 500, 2000);
        light.castShadow = true;

        light.shadowCameraNear = 200;
        light.shadowCameraFar = that.camera.far;
        light.shadowCameraFov = 50;

        light.shadowBias = -0.00022;
        light.shadowDarkness = 0.5;

        light.shadowMapWidth = 2048;
        light.shadowMapHeight = 2048;
        that.lights = $([]);
        that.lights.push(light);

        that.scene.add(light);

        jsonLoader = new THREE.JSONLoader();
        jsonLoader.load("/3d_objs/camera.js", function (geometry) {
            var cam_obj, material, cube;
            cam_obj = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({color: 0x2200cc}));

            cam_obj.material.ambient = cam_obj.material.color;

            cam_obj.position.set(0, 0, 15);

            cam_obj.scale.set(1, 1, 1);
            cam_obj.rotation.set(0, 0, 0);
            cam_obj.model = that.options.app.models.camera;
            //					cam_obj.castShadow = false;
            //					cam_obj.receiveShadow = false;
            material = new THREE.MeshLambertMaterial({
                map: THREE.ImageUtils.loadTexture("/img/grid.gif")
            });

            material.map.needsUpdate = true;

            cube = new THREE.Mesh(
                new THREE.CubeGeometry(8, 5, 0.1),
                material
            );
            cube.model = that.options.app.models.grid;
            cube.model.trigger('move', cube.model, cube);
            cube.overdraw = true;
            that.scene.add(cube);
            that.objects.push(cube);

            cube.position.set(0, 0, 0);

            that.scene.add(cam_obj);

            that.objects.push(cam_obj);
            cam_obj.model.trigger('move', cam_obj.model, cam_obj);


        });

        that.plane = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000, 4, 4), new THREE.MeshBasicMaterial({ color: 0x000000, opacity: 0.25, transparent: true, wireframe: true }));
        xplane = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000, 4, 4), new THREE.MeshBasicMaterial({ color: 0xCC0000, opacity: 0.25, transparent: true, wireframe: true }));
        yplane = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000, 4, 4), new THREE.MeshBasicMaterial({ color: 0x00CC00, opacity: 0.25, transparent: true, wireframe: true }));
        zplane = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000, 4, 4), new THREE.MeshBasicMaterial({ color: 0x0000CC, opacity: 0.25, transparent: true, wireframe: true }));

        yplane.rotation.set(0, 1.57079633, 0);
        zplane.rotation.set(1.57079633, 0, 0);

        that.scene.add(xplane);
        that.scene.add(yplane);
        that.scene.add(zplane);

        that.plane.visible = false;
        that.scene.add(that.plane);

        that.projector = new THREE.Projector();

        that.renderer = new THREE.WebGLRenderer({antialias: true, clearColor: 0x888888, clearAlpha: 255, canvas: that.$('canvas')[0]});
        that.renderer.sortObjects = false;
        that.renderer.setSize(that.$el.innerWidth(), window.innerHeight);

        that.renderer.shadowMapEnabled = true;
        that.renderer.shadowMapSoft = true;

        //that.el.appendChild(that.renderer.domElement );

        /*
           renderer.domElement.addEventListener( 'mousemove', onDocumentMouseMove, false );
           renderer.domElement.addEventListener( 'mousedown', onDocumentMouseDown, false );
           renderer.domElement.addEventListener( 'mouseup', onDocumentMouseUp, false );


           window.addEventListener( 'resize', onWindowResize, false );
           */
        $(window).on('resize', function () {that.on_resize(); });
        that.animate();
    },
    to_screen_xy: function (o) {
        "use strict";
        var that, pos, camera, jqdiv, projScreenMat, object, obj;
        that = this;
        camera = that.camera;
        jqdiv = that.$el;
        obj = that.objects[o];
        pos = obj.position.clone();
        projScreenMat = new THREE.Matrix4();
        projScreenMat.multiply(camera.projectionMatrix, camera.matrixWorldInverse);
        projScreenMat.multiplyVector3(pos);

        return { x: (pos.x + 1) * jqdiv.width() / 2 + jqdiv.offset().left,
             y: (-pos.y + 1) * jqdiv.height() / 2 + jqdiv.offset().top };

    },
    events : {
        'mousemove canvas' : 'on_canvas_mmove',
        'mousedown canvas' : 'on_canvas_mdown',
        'mouseup canvas'   : 'on_canvas_mup'
    },
    on_canvas_mmove : function (event) {
        "use strict";
        event.preventDefault();
        var vector, ray, intersects, loc, forward, target, axis, sinAngle, cosAngle, angle, rotation_measuring_mesh;
        this.mouse.x = (event.clientX / this.$el.innerWidth()) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        vector = new THREE.Vector3(this.mouse.x, this.mouse.y, 0.5);
        this.projector.unprojectVector(vector, this.camera);

        ray = new THREE.Ray(this.camera.position, vector.subSelf(this.camera.position).normalize());

        this.controls.enabled = true;
        if (this.SELECTED) {
            this.controls.enabled = false;

            intersects = ray.intersectObject(this.plane);
            if (intersects[0] && intersects[0].point) {
                if (event.shiftKey) {
                    loc = intersects[0].point.subSelf(this.offset);
                    vector = new THREE.Vector3(0, 0, 0);

                    vector.sub(this.SELECTED.position, loc);

                    // Direction we are already facing (without rotation)
                    forward = new THREE.Vector3(0, 0, -1);

                    // Direction we want to be facing (towards mouse pointer)
                    target = vector.normalize();

                    // Axis and angle of rotation
                    axis = new THREE.Vector3().cross(forward, target);
                    sinAngle = axis.length(); // |u x v| = |u|*|v|*sin(a)
                    cosAngle = forward.dot(target); // u . v = |u|*|v|*cos(a)
                    angle = Math.atan2(sinAngle, cosAngle); // atan2(sin(a),cos(a)) = a
                    axis.normalize();
                    rotation_measuring_mesh = new THREE.Mesh();
                    rotation_measuring_mesh.useQuaternion = true;
                    rotation_measuring_mesh.quaternion.setFromAxisAngle(axis, angle);
                    this.SELECTED.rotation.set(rotation_measuring_mesh.quaternion.x, rotation_measuring_mesh.quaternion.y, rotation_measuring_mesh.quaternion.z);
                    this.SELECTED.rotation.multiplyScalar(0.5);

                } else {
                    this.SELECTED.position.copy(intersects[0].point.subSelf(this.offset));
                }
                this.SELECTED.model.trigger('move', this.SELECTED.model, this.SELECTED);
            }
            return;

        }


        intersects = ray.intersectObjects(this.objects);

        if (intersects.length > 0) {

            if (this.INTERSECTED !== intersects[0].object) {

                if (this.INTERSECTED) {
                    this.INTERSECTED.material.color.setHex(this.INTERSECTED.currentHex);
                }

                this.INTERSECTED = intersects[0].object;
                this.INTERSECTED.currentHex = this.INTERSECTED.material.color.getHex();

                this.plane.position.copy(this.INTERSECTED.position);
                this.plane.lookAt(this.camera.position);
                this.plane.rotation.copy(this.camera.rotation);

            }

            this.el.style.cursor = 'pointer';

        } else {

            if (this.INTERSECTED) {
                this.INTERSECTED.material.color.setHex(this.INTERSECTED.currentHex);
            }

            this.INTERSECTED = null;

            this.el.style.cursor = 'auto';

        }


    },
    on_canvas_mdown : function (event) {
        "use strict";
        var that, vector, ray, intersects;
        that = this;

        event.preventDefault();

        vector = new THREE.Vector3(that.mouse.x, that.mouse.y, 0.5);
        that.projector.unprojectVector(vector, that.camera);

        ray = new THREE.Ray(that.camera.position, vector.subSelf(that.camera.position).normalize());

        intersects = ray.intersectObjects(that.objects);

        if (intersects.length > 0) {

            that.controls.enabled = false;

            that.SELECTED = intersects[0].object;

            intersects = ray.intersectObject(that.plane);
            that.offset.copy(intersects[0].point).subSelf(that.plane.position);

            that.el.style.cursor = 'move';

        }


    },
    on_canvas_mup : function (event) {
        "use strict";
        event.preventDefault();
        this.controls.enabled = true;

        if (this.INTERSECTED) {
            this.plane.position.copy(this.INTERSECTED.position);
            this.SELECTED = null;
        }

        this.el.style.cursor = 'auto';

    },
    on_resize : function (event) {
        "use strict";
        this.camera.aspect = this.$el.innerWidth() / this.$el.innerHeight();
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(this.$el.innerWidth(), this.$el.innerHeight());


    },
    animate : function () {
        "use strict";
        var that = this;
        requestAnimationFrame(function () {that.animate(); });
        that.render();
    },
    render : function () {
        "use strict";
        var that;
        that = this;

        if (that.rendered === undefined && that.objects.length > 0) {
            that.rendered = true;
            that.trigger('rendered');
        }
	    that.controls.update();
        that.renderer.render(that.scene, that.camera);
    }
});

SimCam.Constructor.View.SideCanvas = Backbone.View.extend({
    initialize: function (options) {
        "use strict";
        var that, light, cc, material, cube, cv;
        that = this;
        that.options = options;

        that.camera = new THREE.PerspectiveCamera();
        cc = options.app.models.camera;

        cc.set('fov', that.camera.fov);
        cc.set('aspect', that.camera.aspect);
        cc.set('far', that.camera.far);
        cc.set('near', that.camera.near);
        cc.set('u', 200);
        cc.set('v', 200);
        cc.trigger('set', cc);
        that.camera.position.set(0, 0, 15);

        that.scene = new THREE.Scene();
        that.scene.add(new THREE.AmbientLight(0x505050));

        light = new THREE.SpotLight(0xffffff, 1.5);
        light.position.set(0, 500, 2000);
        light.castShadow = true;

        light.shadowCameraNear = 200;
        light.shadowCameraFar = that.camera.far;
        light.shadowCameraFov = 50;

        light.shadowBias = -0.00022;
        light.shadowDarkness = 0.5;

        light.shadowMapWidth = 2048;
        light.shadowMapHeight = 2048;
        that.scene.add(light);

        that.texture_loaded = false;

        material = new THREE.MeshLambertMaterial({
            map: THREE.ImageUtils.loadTexture("/img/grid.gif", undefined, function () { that.texture_loaded = true; })
        });

        material.map.needsUpdate = true;

        cube = new THREE.Mesh(new THREE.CubeGeometry(8, 5, 0.1), material);
        cube.overdraw = true;
        that.scene.add(cube);
        that.grid = cube;
        that.camera.lookAt(that.grid);
        that.camera.rotation.set(0, 0, 0);
        cv = that.$('canvas');

        that.renderer = new THREE.WebGLRenderer({antialias: true, clearColor: 0x888888, clearAlpha: 255, canvas: that.$('canvas')[0]});
        that.renderer.sortObjects = false;
        that.renderer.setSize(cv.innerHeight(), cv.innerWidth());

        options.app.models.grid.bind('move', function (o, m) {that.update_grid(o, m); });
        options.app.models.camera.bind('move', function (o, m) {that.update_cam(o, m); });
        options.app.models.camera.bind('update_pinhole_params', function (m) { that.on_update_pinhole_params(m); });
        options.app.models.camera.bind('update_distortions_params', function (m) { that.on_update_distortions_params(m); });

        options.app.models.calibration.bind('request_capture', function (m) { that.on_request_capture(m); });


        $(window).on('resize', function () { that.on_resize(); });

        that.update_current_data_url = true;
        that.animate();
        that.on_resize();
    },
    events : {
    },
    on_resize : function () {
        "use strict";
        var that, width, cv, camera;
        that = this;
        camera = that.options.app.models.camera;

        width = camera.get('u');

        cv = that.$el;
        if (that.renderer) {
            that.renderer.setSize(width * that.camera.aspect, width);
        }

    },
    animate : function () {
        "use strict";
        var that = this;
        requestAnimationFrame(function () { that.animate(); });
        if (that.texture_loaded) {
            that.render();
        }

    },
    render : function () {
        "use strict";
        var that = this;
        that.renderer.render(that.scene, that.camera);
        if (that.update_current_data_url) {
            that.current_image = that.$('canvas')[0].toDataURL();

            that.on_update_current_image();
            that.update_current_data_url = false;
        }
    },
    update_grid : function (model, obj) {
        "use strict";
        var that, grid;
        that = this;
        grid = that.options.app.models.grid;
        grid.set('position', [obj.position.x, obj.position.y, obj.position.z]);
        grid.set('rotation', [obj.rotation.x, obj.rotation.y, obj.rotation.z]);
        that.grid.position.copy(obj.position);
        that.grid.rotation.copy(obj.rotation);
        that.update_current_data_url = true;
    },
    update_cam : function (model, obj) {
        "use strict";
        var that, cam;
        that = this;
        cam = that.options.app.models.camera;
        cam.set('position', [obj.position.x, obj.position.y, obj.position.z]);
        cam.set('rotation', [obj.rotation.x, obj.rotation.y, obj.rotation.z]);

        that.camera.position.copy(obj.position);
        that.camera.rotation.copy(obj.rotation);
        that.update_current_data_url = true;

    },
    get_mean_image : function (data_url) {
        "use strict";
        var that, total, sum, arr;
        that = this;

        arr = Base64Binary.decode(data_url);
        total = arr.length;

        sum = 0;
        _.each(arr, function (obj) {
            sum += obj;
        });

        return (sum / total);
    },
    update_distortion_image : function () {
        "use strict";
        var that, ImageConstructor, camera_model, image_model, params, distortion_url_bit;
        that = this;
        if (that.loading_image) {
            return false;
        }
        that.loading_image = true;
        camera_model = that.options.app.models.camera;

        distortion_url_bit = '';
        params = ['t1', 't2', 'r1', 'r2', 'r3'];
        _.each(params, function (param) {
            var param_model = camera_model.get(param);
            if (param_model) {
                distortion_url_bit += param + '=' + param_model + '&';
            }
        });

        if (distortion_url_bit === '') {
            that.loading_image = false;
            that.current_distortion = undefined;
            that.current_image_undistorted = undefined;
            return false;
        }

        ImageConstructor = Backbone.Model.extend({ url: '/api/image' });

        image_model = new ImageConstructor({
            "image": that.current_image,
            "type" : 'base64'
        });
        image_model.save({ },
            {
                success : function (data, textStatus, jqXHR) {
                    var dist_url, image, image_element;
                    that.current_image_undistorted = data.get('img');
                    dist_url  = '/api/distort/' + data.get('img') + '?' + distortion_url_bit;
                    $.getJSON(dist_url, function (d) {
                        var dist_image_src = '/uploads/' + d.out;
                        that.current_distortion = d;

                        image_element = that.$('img');
                        if (image_element.length > 0) {
                            image_element.attr('src', dist_image_src);
                        } else {
                            image_element = $('<img style="position:absolute; z-index: 2; top:0px; right: 0px" src="' + dist_image_src + '" />');
                            that.$el.append(image_element);
                        }

                    });
                    that.loading_image = false;
                },
                error : function () { that.loading_image = false; }
            });
    },
    on_update_current_image: function () {
        "use strict";
        var that = this;
        that.update_distortion_image();

    },
    on_update_pinhole_params: function (model) {
        "use strict";
        var that, attrs;
        that = this;
        //TODO: do only fov, near, far, aspect, u, v
        _.each(model.attributes, function (o, i) {
            that.camera[i] = o;
        });
        that.camera.updateProjectionMatrix();
        that.on_resize();
        that.render();
    },
    on_update_distortions_params: function (model) {
        "use strict";
        var that;
        that = this;
        that.on_update_current_image();
    },
    on_request_capture: function (model) {
        "use strict";
        var that, current_capture, cc_img, check_url, check_data;
        that = this;

        current_capture = new SimCam.Constructor.Model.Generic({});

        current_capture.set('undistorted', { url : that.current_image, img: that.current_image_undistorted });
        current_capture.set('distorted', that.current_distortion);

        check_url = '/api/check';
        check_data = undefined;
        if (that.current_distortion) {
            cc_img = that.current_distortion.out;
            check_url += '/' + cc_img;
        } else if (that.current_image_undistorted) {
            cc_img = that.current_image_undistorted;
            check_url += '/' + cc_img;
        } else {
            cc_img = that.current_image;
            current_capture.set('type', 'base64');
            check_data = { 'type' : 'base64', 'image' : cc_img};
        }

        current_capture.set('camera', that.options.app.models.camera.toJSON());
        current_capture.set('grid', that.options.app.models.grid.toJSON());


        $.getJSON(check_url, check_data, function (data) { current_capture.set('checked', data); })
            .done(function () {
                current_capture.set('image', cc_img);
                model.get('captures').add(current_capture);
                console.log(current_capture);
            });
    }
});


SimCam.Constructor.View.SideMenu = Backbone.View.extend({
    initialize: function (options) {
        "use strict";
        var that;
        that = this;
        that.app = options.app;
        that.render(options.mode);
        that.app.models.camera.bind('set', that.on_camera_model_set, that);
    },
    events : {
        'keyup .pinhole_sidemenu_input' : 'on_change_pinhole_sidemenu_input',
        'keyup .distortions_sidemenu_input' : 'on_change_distortions_sidemenu_input',
        'click [name="capture"]' : 'on_click_capture_btn',
        'click [name="calibrate"]' : 'on_click_calibrate_btn',
        'click [name="results"]' : 'on_click_results_btn'
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

    },
    on_camera_model_set: function (model) {
        "use strict";
        var that, attrs;
        that = this;
        attrs = model.attributes;
        _.each(attrs, function (value, name) {
            that.$('[name="' + name + '"]').val(value);
        });
    },
    on_change_pinhole_sidemenu_input : function (e) {
        "use strict";
        var that, cur_target, name, value, cm, u, v;
        that = this;
        cur_target = $(e.currentTarget);
        name = cur_target.attr('name');
        value = cur_target.val();
        cm = that.app.models.camera;
        cm.set(name, value);

        if (name === 'u') {
            u = value;
            v = cm.get('v');
            cm.set('aspect', u / v);
            that.$('[name="aspect"]').val(u / v);
        } else if (name === 'v') {
            v = value;
            u = cm.get('u');
            cm.set('aspect', u / v);
            that.$('[name="aspect"]').val(u / v);
        }
        cm.trigger('update_pinhole_params', cm);

    },
    on_change_distortions_sidemenu_input : function (e) {
        "use strict";
        var that, cur_target, name, value, cm;
        that = this;
        cur_target = $(e.currentTarget);
        name = cur_target.attr('name');
        value = cur_target.val();
        cm = that.app.models.camera;
        cm.set(name, value);
        cm.trigger('update_distortions_params', cm);
    },
    on_click_capture_btn : function () {
        "use strict";
        var that = this;
        that.app.models.calibration.trigger('request_capture', that.app.models.calibration);
    },
    on_click_calibrate_btn : function () {
        "use strict";
        var that = this;
        that.app.models.calibration.trigger('request_calibrate', that.app.models.calibration);

    },
    on_click_results_btn : function () {
        "use strict";
        var that = this;
        that.app.models.calibration.trigger('request_results', that.app.models.calibration);

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
        var that;
        that = this;
        if (options.mode.type !== 'calibration') {
            that.$el.hide();
            return;
        }

        that.model = options.app.models.calibration;
        that.collection = that.model.get('captures');

        that.$('.bottom_bar_image_holder').html('');

        that.collection.bind('add', that.on_add_capture, that);
    },
    on_add_capture: function (model) {
        "use strict";
        var that, img_holder;
        that = this;
        that.$('.captured_count').html(that.collection.length);
        img_holder = that.$('.bottom_bar_image_holder');

        img_holder.append('<img src="/uploads/' + model.get('checked').out +  '" class="bottom_bar_img" />');

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

        that.main_viewer       = new SimCam.Constructor.View.MainCanvas({ el: mv_body, mode: that.mode, app: options.app, render_cb : function (t) { that.on_main_viewer_render(t); } });
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
    on_main_viewer_render : function (t) {
        "use strict";
        var that;
        that = this;
        if (!that.options.learning_environment) {
            return;
        }
        _.each(t.objects, function (o, i) {
            var elem, loc, placement;
            loc = t.to_screen_xy(i);
            elem = $('<p style="position:absolute; z-index:4; top: ' + loc.y + 'px; left: ' + loc.x + 'px;" data-toggle="popover" ></p>');
            that.$el.append(elem);
            placement = 'top';
            if (i % 2) {
                placement = 'bottom';
            }
            elem.popover({
                'placement' : placement,
                'html': true,
                'title': '3D element',
                'content': 'Click and drag to move. Hold shift and drag to rotate. <input type="button" class="close_popover btn" value="close">'
            });
            elem.popover('toggle');
        });
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

        that.models = { camera: new SimCam.Constructor.Model.Generic({ }), grid: new SimCam.Constructor.Model.Generic(), calibration: new SimCam.Constructor.Model.Generic({ captures: new SimCam.Constructor.Collection.Generic() }) };

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
    var app, image_preload;
    image_preload = new Image();
    image_preload.onload = function () {
        app = new SimCam.Constructor.Router.App(options);
        if (options.success) {
            options.success(app);
        }

        Backbone.history.start();
    };
    image_preload.src = '/img/grid.gif';
    return app;
};

