// UI Components
let canvas = d3.select('#canvas'),
    coordinates_display = d3.select('#coordinates'),
    button_fort_14 = d3.select('#fort14_button'),
    button_draw_ellipse = d3.select('#ellipse_draw_button'),
    button_edit_ellipse = d3.select('#ellipse_edit_button'),
    button_save_shapefile = d3.select('#save_shapefile_button'),
    file_chooser_fort_14 = d3.select('#fort14'),
    overlay = d3.select('#overlay'),
    message = d3.select('#message');


// ADCIRC Components
let renderer = adcirc.gl_renderer(canvas),
    data,
    mesh;

// Selection Tools
let ellipse_tool = ellipse_editor(overlay);

// UI Connections
button_fort_14.on('click', pick_fort14);
button_draw_ellipse.on('click', ellipse_tool.draw_mode);
button_edit_ellipse.on('click', ellipse_tool.edit_mode);
button_save_shapefile.on('click', on_save_shapefile);
file_chooser_fort_14.on('change', on_fort14);

// ADCIRC Connections
renderer.on('hover', on_hover);
renderer.on('projection', on_projection);

// Selection Tool Connections
ellipse_tool.on('finished', on_ellipse_finished);
ellipse_tool.on('mode', on_tool_mode);

// Initialize UI
renderer.clear_color('#dddddd');
button_edit_ellipse.style('display', 'none');
button_save_shapefile.style('display', 'none');

function on_ellipse_finished () {
    button_edit_ellipse.style('display', null);
    button_save_shapefile.style('display', null);
}

function on_fort14 () {

    data = dataset(renderer);
    mesh = data.mesh();

    data
        .on('progress', on_progress)
        .on('render', renderer.render)
        .on('view', on_view)
        .on('mesh_loaded', on_mesh_loaded);

    data.load_fort_14(file_chooser_fort_14.node().files[0]);
}

function on_hover (event) {
    coordinates_display.text(
        event.coordinates[0].toFixed(8) +
        ', ' +
        event.coordinates[1].toFixed(8)
    );
}

function on_mesh_loaded () {

    data.view('depth');

}

function on_progress (event) {

}

function on_projection (event) {
    ellipse_tool.set_transform(event.transform);
}

function on_save_shapefile () {

    let ellipse = ellipse_tool.ellipse();
    let text = '';

    if (ellipse) {

        text += ellipse[0][0].toFixed(10) + ' ' + ellipse[0][1].toFixed(10) + '\n';
        text += ellipse[1][0].toFixed(10) + ' ' + ellipse[1][1].toFixed(10) + '\n';
        text += ellipse[2].toFixed(10);

    }

    let blob = new Blob([text], {type: 'text/plain;charset=utf-8'});
    saveAs(blob, 'shape.e14')

}

function on_tool_mode (mode) {

    switch (mode) {

        case 'draw':
            message.text('Place points to draw ellipse. Press Esc or Enter to cancel.');
            button_draw_ellipse.style('background-color', 'lightsteelblue');
            break;

        case 'edit':
            message.text('Drag points to edit ellipse. Press Esc or Enter to finish.');
            button_edit_ellipse.style('background-color', 'lightsteelblue');
            break;

        case 'sleep':
            message.text(null);
            button_draw_ellipse.style('background-color', null);
            button_edit_ellipse.style('background-color', null);
            break;

    }

}

function on_view (event) {
    renderer.set_view(event.view);
    renderer.zoom_to(mesh, 250);
}

function pick_fort14 () {
    file_chooser_fort_14.node().click();
}