function ellipse_editor (svg) {

    let body = d3.select('body'),
        g = svg.append('g'),
        cx, // center x-coordinate
        cy, // center y-coordinate
        rx, // x radius
        ry, // y radius
        ng; // rotation angle

    let center, // center point
        xpt,    // x radius point
        ypt,    // y radius point
        ell,    // ellipse_tool
        f1,     // foci
        f2;

    let finished = false; // all parts of ellipse exist

    let transform; // screen to local coordinate transform

    let cb = {}; // callbacks;


    capture_pointer_events(false);


    function ellipse () {}

    ellipse.draw_mode = function () {

        reset();
        capture_pointer_events(true);
        capture_keyboard_events(true);

        ell = add_ellipse('ellipse');

        enable_place_center_mode();

        fire_callback('mode', 'draw');

    };

    ellipse.edit_mode = function () {

        if (center && xpt && ypt) {

            wake();
            capture_pointer_events(true);
            capture_keyboard_events(true);

            center
                .style('cursor', 'grab')
                .call(d3.drag().on('drag', set_center));

            xpt
                .style('cursor', 'grab')
                .call(d3.drag().on('drag', set_xpt));

            ypt
                .style('cursor', 'grab')
                .call(d3.drag().on('drag', set_ypt));

            fire_callback('mode', 'edit');

        }

    };

    ellipse.ellipse = function () {

        if (xpt && ypt && f1 && f2) {

            let center_screen = [center.attr('cx'), center.attr('cy')],
                f1_screen = [f1.attr('cx'), f1.attr('cy')],
                f2_screen = [f2.attr('cx'), f2.attr('cy')],
                center_mesh = screen_to_mesh(center_screen),
                f1_mesh = screen_to_mesh(f1_screen),
                f2_mesh = screen_to_mesh(f2_screen);

            let r = rx > ry
                ? distance(center_mesh[0], center_mesh[1], f1_mesh[0], f1_mesh[1])
                : distance(center_mesh[0], center_mesh[1], f2_mesh[0], f2_mesh[1]);

            return [f1_mesh, f2_mesh, 2*r];

        }

    };

    ellipse.on = function (name, callback) {
        cb[name] = callback;
    };

    ellipse.set_transform = function (new_transform) {

        if (center && xpt && ypt) {

            let mesh_center = screen_to_mesh([cx, cy]),
                mesh_xpt = screen_to_mesh([xpt.attr('cx'), xpt.attr('cy')]),
                mesh_ypt = screen_to_mesh([ypt.attr('cx'), ypt.attr('cy')]);

            transform = new_transform;

            let screen_center = mesh_to_screen(mesh_center),
                screen_xpt = mesh_to_screen(mesh_xpt),
                screen_ypt = mesh_to_screen(mesh_ypt);

            cx = screen_center[0];
            cy = screen_center[1];
            rx = distance(cx, cy, screen_xpt[0], screen_xpt[1]);
            ry = distance(cx, cy, screen_ypt[0], screen_ypt[1]);

            calculate_center_position();
            update_ellipse();

        } else {

            transform = new_transform;

        }

    };

    return ellipse;


    function add_dot (id) {

        let dot = g
            .selectAll('#' + id)
            .data([id]);

        dot
            .exit()
            .remove();

        dot = dot
            .enter()
            .append('circle')
            .attr('id', id)
            .attr('r', 5)
            .attr('stroke', 'black')
            .attr('stroke-width', 2)
            .attr('fill', 'black')
            .merge(dot);

        return dot;

    }

    function add_ellipse (id) {

        return g
            .append('ellipse')
            .attr('id', id)
            .style('fill', 'none')
            .style('stroke', 'black');

    }

    function calculate_center_position () {

        if (center && cx !== null && cy !== null) {

            // Never really calculated, but uniformity looks nice
            center
                .attr('cx', cx)
                .attr('cy', cy);

            // Cascade changes
            calculate_xpt_position();

        }

    }

    function calculate_foci () {

        if (f1 && f2 && cx !== null && cy !== null && ng !== null && rx !== null && ry !== null) {

            // a is the 'width' of the ellipse_tool
            // b is the 'height' of the ellipse_tool
            // c is the distance from the centerpoint to the foci
            let a = rx > ry ? rx: ry,
                b = rx > ry ? ry: rx,
                c = Math.sqrt(a ** 2 - b ** 2);

            let angle = (rx > ry ? ng : ng - 90) * Math.PI / 180;

            let x1 = cx + c * Math.cos(angle),
                y1 = cy + c * Math.sin(angle),
                x2 = cx - c * Math.cos(angle),
                y2 = cy - c * Math.sin(angle);

            f1
                .attr('cx', x1)
                .attr('cy', y1);

            f2
                .attr('cx', x2)
                .attr('cy', y2);

        }

    }

    function calculate_xpt_position () {


        if (xpt && rx !== null && ng !== null) {

            // Calculate coordinates
            let x = cx + rx * Math.cos(ng * Math.PI / 180),
                y = cy + rx * Math.sin(ng * Math.PI / 180);

            // Move the dot
            xpt
                .attr('cx', x)
                .attr('cy', y);

            // Cascade changes
            calculate_ypt_position();

        }

    }

    function calculate_ypt_position () {

        if (ypt && ry !== null) {

            // Calculate coordinates
            let x = cx + ry * Math.sin((180 - ng) * Math.PI / 180),
                y = cy + ry * Math.cos((180 - ng) * Math.PI / 180);

            // Move the dot
            ypt
                .attr('cx', x)
                .attr('cy', y);

            calculate_foci();

        }

    }

    function capture_keyboard_events (capture) {

        body.on('keydown', capture ? _respond : null);

        function _respond () {

            switch (d3.event.key) {

                case 'Enter':
                case 'Escape':
                    capture_keyboard_events(false);
                    sleep();

            }

        }

    }

    function capture_pointer_events (capture) {
        svg.style('pointer-events', capture ? null : 'none');
    }

    function distance (x1, y1, x2, y2) {
        return Math.sqrt((x2-x1)**2 + (y2-y1)**2);
    }

    function enable_place_center_mode () {

        // Add the center dot
        center = add_dot('center');

        // Respond to mouse movements
        svg
            .on('mousemove', set_center)
            .on('click', enable_place_xpt_mode);

    }

    function enable_place_xpt_mode () {

        // Add the x-point dot
        xpt = add_dot('xpt')
            .attr('fill', 'steelblue')
            .attr('stroke', 'midnightblue');

        // Respond to mouse movements
        svg
            .on('mousemove', set_xpt)
            .on('click', enable_place_ypt_mode);

    }

    function enable_place_ypt_mode () {

        // Add the y-point dot
        ypt = add_dot('ypt')
            .attr('fill', 'tomato')
            .attr('stroke', 'maroon');

        // Add the foci
        f1 = add_dot('f1')
            .attr('r', 2);
        f2 = add_dot('f2')
            .attr('r', 2);

        // Respond to mouse movements
        svg
            .on('mousemove', set_ypt)
            .on('click', finish);

    }

    function fire_callback (name) {

        if (name in cb) {
            let args = [].slice.call(arguments);
            cb[name].apply(null, args.slice(1));
        }

    }

    function finish () {

        finished = true;
        sleep();
        fire_callback('finished');

    }

    function mesh_to_screen (point) {
        let height = parseInt(svg.style('height')),
            inverted_point = [point[0], height - point[1]];
        return transform.apply(inverted_point);

        // return transform ? transform.apply(point) : point;
    }

    function reset () {

        g.selectAll('ellipse').remove();
        g.selectAll('circle').remove();

        cx = null;
        cy = null;
        rx = null;
        ry = null;
        ng = null;
        finished = false;

    }

    function screen_to_mesh (point) {
        let height = parseInt(svg.style('height')),
            mesh_point = transform ? transform.invert(point) : point;
        return [mesh_point[0], height - mesh_point[1]];
        // return transform ? transform.invert(point) : point;
    }

    function set_center () {

        // Set the center x- and y-coordinates
        cx = d3.event.x;
        cy = d3.event.y;

        // Move the dot and cascade changes
        calculate_center_position();

        // Update the ellipse_tool
        update_ellipse();


    }

    function set_xpt () {

        // Get the mouse coordinates
        let x = d3.event.x,
            y = d3.event.y,
            dx = x - cx,
            dy = y - cy;

        // Calcalate distance and angle from center
        rx = distance(cx, cy, x, y);
        ng = Math.atan2(dy, dx) * 180 / Math.PI;
        ng = (360 + ng) % 360;

        // Move the dot and cascade changes
        calculate_xpt_position();

        // Update the ellipse_tool
        update_ellipse();

    }

    function set_ypt () {

        // Get the mouse coordinates
        let x = d3.event.x,
            y = d3.event.y;

        // Calculate distance from center
        ry = distance(cx, cy, x, y);

        // Move the dot
        calculate_ypt_position();

        // Update the ellipse_tool
        update_ellipse();

    }

    function sleep () {

        // Stop listening to events
        capture_pointer_events(false);
        svg
            .on('mousemove', null)
            .on('click', null);

        // Hide editing dots
        if (center) center.attr('display', 'none');
        if (xpt) xpt.attr('display', 'none');
        if (ypt) ypt.attr('display', 'none');

        // Catch early exits
        if (!finished) reset();

        fire_callback('mode', 'sleep');

    }

    function update_ellipse () {

        let can_rotate = ng !== null && cx !== null && cy !== null;

        ell
            .attr('cx', cx)
            .attr('cy', cy)
            .attr('rx', rx)
            .attr('ry', ry !== null ? ry : rx)
            .attr('transform', can_rotate ? 'rotate(' + ng + ' ' + cx + ' ' + cy + ')' : null);

    }

    function wake () {

        if (center) center.attr('display', null);
        if (xpt) xpt.attr('display', null);
        if (ypt) ypt.attr('display', null);

    }

}