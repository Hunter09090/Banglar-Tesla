extends Node3D
## First 3D milestone: procedural low-poly city road, steerable car, traffic, chase camera.
## Keep this prototype asset-free and easy to run; replace primitives with licensed assets later.

const ROAD_WIDTH := 12.0
const PLAYER_Z := 2.0
const MAX_STEER := 4.1
const BASE_SPEED := 22.0
const BOOST_SPEED := 37.0
const TRAFFIC_COUNT := 9

var player_x := 0.0
var speed := BASE_SPEED
var boost_charge := 100.0
var score := 0
var collisions := 0
var traffic: Array[Node3D] = []
var traffic_speeds: Array[float] = []
var steer_left := false
var steer_right := false
var boost_pressed := false
var boost_cooldown := 0.0
var status_label: Label
var help_label: Label
var camera: Camera3D
var player_car: Node3D
var rng := RandomNumberGenerator.new()

var road_mat: StandardMaterial3D
var line_mat: StandardMaterial3D
var grass_mat: StandardMaterial3D
var building_mats: Array[StandardMaterial3D] = []
var car_mats: Array[StandardMaterial3D] = []

func _ready() -> void:
	rng.randomize()
	_make_materials()
	_make_environment()
	_make_road()
	_make_city()
	_make_player()
	_make_traffic()
	_make_camera()
	_make_hud()
	_update_hud()

func _process(delta: float) -> void:
	var steer := 0.0
	if Input.is_key_pressed(KEY_A) or Input.is_key_pressed(KEY_LEFT) or steer_left:
		steer -= 1.0
	if Input.is_key_pressed(KEY_D) or Input.is_key_pressed(KEY_RIGHT) or steer_right:
		steer += 1.0
	player_x = clampf(player_x + steer * MAX_STEER * delta, -4.25, 4.25)
	player_car.position.x = lerpf(player_car.position.x, player_x, minf(delta * 8.0, 1.0))
	player_car.rotation.z = lerpf(player_car.rotation.z, -steer * 0.07, minf(delta * 5.0, 1.0))

	var wants_boost := Input.is_key_pressed(KEY_SPACE) or boost_pressed
	if wants_boost and boost_charge > 0.0 and boost_cooldown <= 0.0:
		speed = BOOST_SPEED
		boost_charge = maxf(0.0, boost_charge - 30.0 * delta)
	else:
		speed = lerpf(speed, BASE_SPEED, minf(delta * 2.5, 1.0))
		boost_charge = minf(100.0, boost_charge + 5.0 * delta)
	boost_cooldown = maxf(0.0, boost_cooldown - delta)

	for i in range(traffic.size()):
		var vehicle := traffic[i]
		vehicle.position.z += (speed - traffic_speeds[i]) * delta
		if vehicle.position.z > 10.0:
			vehicle.position.z = rng.randf_range(-115.0, -75.0)
			vehicle.position.x = _random_lane()
			traffic_speeds[i] = rng.randf_range(10.0, 18.0)
			score += 1
		if absf(vehicle.position.z - PLAYER_Z) < 2.3 and absf(vehicle.position.x - player_x) < 1.45:
			collisions += 1
			vehicle.position.z = rng.randf_range(-100.0, -70.0)
			vehicle.position.x = _random_lane()
			player_x = clampf(player_x + (1.0 if player_x <= vehicle.position.x else -1.0), -4.25, 4.25)
			boost_charge = maxf(0.0, boost_charge - 15.0)
			boost_cooldown = 1.2

	_update_hud()

func _make_materials() -> void:
	road_mat = _mat(Color(0.16, 0.18, 0.20), 0.92)
	line_mat = _mat(Color(0.95, 0.88, 0.57), 0.7)
	grass_mat = _mat(Color(0.20, 0.42, 0.22), 1.0)
	for c in [Color(0.72,0.55,0.38), Color(0.78,0.76,0.66), Color(0.50,0.63,0.69), Color(0.75,0.45,0.35), Color(0.72,0.68,0.49)]:
		building_mats.append(_mat(c, 0.9))
	for c in [Color(0.80,0.12,0.10), Color(0.08,0.38,0.76), Color(0.10,0.48,0.30), Color(0.88,0.65,0.12)]:
		car_mats.append(_mat(c, 0.45))

func _mat(color: Color, roughness: float) -> StandardMaterial3D:
	var material := StandardMaterial3D.new()
	material.albedo_color = color
	material.roughness = roughness
	return material

func _make_environment() -> void:
	var world := WorldEnvironment.new()
	var env := Environment.new()
	env.background_mode = Environment.BG_COLOR
	env.background_color = Color(0.47, 0.70, 0.89)
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color(0.72, 0.76, 0.82)
	env.ambient_light_energy = 0.8
	world.environment = env
	add_child(world)
	var sun := DirectionalLight3D.new()
	sun.rotation_degrees = Vector3(-48.0, -28.0, 0.0)
	sun.light_energy = 1.15
	add_child(sun)

func _make_road() -> void:
	_box("Grass", Vector3(90, 0.2, 190), Vector3(0, -0.18, -45), grass_mat)
	_box("Road", Vector3(ROAD_WIDTH, 0.18, 190), Vector3(0, -0.04, -45), road_mat)
	for x in [-ROAD_WIDTH / 2.0, ROAD_WIDTH / 2.0]:
		_box("Road edge", Vector3(0.16, 0.05, 190), Vector3(x, 0.07, -45), line_mat)
	for z in range(-135, 35, 8):
		_box("Lane dash", Vector3(0.12, 0.035, 3.2), Vector3(0, 0.08, float(z)), line_mat)
		_box("Lane dash", Vector3(0.09, 0.035, 2.0), Vector3(-4, 0.08, float(z)), line_mat)
		_box("Lane dash", Vector3(0.09, 0.035, 2.0), Vector3(4, 0.08, float(z)), line_mat)

func _make_city() -> void:
	for side in [-1.0, 1.0]:
		for i in range(15):
			var z := -130.0 + float(i) * 10.0
			var width := rng.randf_range(4.0, 7.5)
			var height := rng.randf_range(5.0, 17.0)
			var depth := rng.randf_range(5.0, 9.0)
			var x := side * rng.randf_range(9.0, 14.0)
			var building := _box("Dhaka street building", Vector3(width, height, depth), Vector3(x, height / 2.0 - 0.05, z), building_mats[rng.randi_range(0, building_mats.size() - 1)])
			building.rotation.y = rng.randf_range(-0.06, 0.06)
			# Simple contrasting window strips make the block read as a city, not empty cubes.
			for floor_index in range(maxi(1, int(height / 2.5))):
				_box("Window band", Vector3(width * 0.62, 0.22, 0.08), Vector3(x, 1.3 + float(floor_index) * 2.3, z - depth / 2.0 - 0.05), _mat(Color(0.20, 0.35, 0.43), 0.35))

func _make_player() -> void:
	player_car = _make_car("Player Tesla", car_mats[0], true)
	player_car.position = Vector3(0, 0.1, PLAYER_Z)

func _make_traffic() -> void:
	for i in range(TRAFFIC_COUNT):
		var vehicle := _make_car("Traffic vehicle %d" % i, car_mats[(i + 1) % car_mats.size()], false)
		vehicle.position = Vector3(_random_lane(), 0.1, -12.0 - float(i) * 13.0)
		traffic.append(vehicle)
		traffic_speeds.append(rng.randf_range(10.0, 18.0))

func _make_car(label_text: String, body_mat: StandardMaterial3D, is_player: bool) -> Node3D:
	var car := Node3D.new()
	car.name = label_text
	add_child(car)
	var body := _box("Body", Vector3(1.55, 0.58, 3.1), Vector3(0, 0.62, 0), body_mat, car)
	_box("Cabin", Vector3(1.12, 0.62, 1.35), Vector3(0, 1.15, -0.18), _mat(Color(0.12, 0.20, 0.25), 0.22), car)
	_box("Front glass", Vector3(0.94, 0.34, 0.06), Vector3(0, 1.19, -0.88), _mat(Color(0.35, 0.68, 0.78), 0.18), car)
	for x in [-0.83, 0.83]:
		for z in [-0.98, 0.98]:
			var wheel := MeshInstance3D.new()
			var wheel_mesh := CylinderMesh.new()
			wheel_mesh.top_radius = 0.28
			wheel_mesh.bottom_radius = 0.28
			wheel_mesh.height = 0.18
			wheel.mesh = wheel_mesh
			wheel.material_override = _mat(Color(0.06,0.06,0.07), 0.95)
			wheel.position = Vector3(x, 0.35, z)
			wheel.rotation.z = PI / 2.0
			car.add_child(wheel)
	if is_player:
		_box("Boost glow", Vector3(0.45, 0.08, 0.3), Vector3(0, 0.35, 1.58), _mat(Color(0.2, 0.75, 1.0), 0.3), car)
	return car

func _box(label_text: String, size: Vector3, at: Vector3, material: StandardMaterial3D, parent: Node3D = null) -> MeshInstance3D:
	var mesh_node := MeshInstance3D.new()
	mesh_node.name = label_text
	var box := BoxMesh.new()
	box.size = size
	mesh_node.mesh = box
	mesh_node.material_override = material
	mesh_node.position = at
	if parent == null:
		add_child(mesh_node)
	else:
		parent.add_child(mesh_node)
	return mesh_node

func _make_camera() -> void:
	camera = Camera3D.new()
	camera.name = "ThirdPersonCamera"
	camera.position = Vector3(0, 5.2, 10.5)
	camera.rotation_degrees = Vector3(-16.0, 0, 0)
	camera.current = true
	add_child(camera)

func _make_hud() -> void:
	var layer := CanvasLayer.new()
	add_child(layer)
	status_label = Label.new()
	status_label.position = Vector2(22, 18)
	status_label.add_theme_font_size_override("font_size", 22)
	status_label.add_theme_color_override("font_color", Color(1, 1, 1))
	layer.add_child(status_label)
	help_label = Label.new()
	help_label.text = "A/D or ←/→: steer   •   SPACE: Jet Boost   •   Avoid traffic"
	help_label.position = Vector2(22, 52)
	help_label.add_theme_font_size_override("font_size", 15)
	help_label.add_theme_color_override("font_color", Color(0.96, 0.98, 1.0))
	layer.add_child(help_label)

	var left_button := _touch_button(layer, "◀", Vector2(22, -105), true)
	left_button.button_down.connect(func(): steer_left = true)
	left_button.button_up.connect(func(): steer_left = false)
	var right_button := _touch_button(layer, "▶", Vector2(112, -105), true)
	right_button.button_down.connect(func(): steer_right = true)
	right_button.button_up.connect(func(): steer_right = false)
	var boost_button := _touch_button(layer, "BOOST", Vector2(-150, -105), false)
	boost_button.button_down.connect(func(): boost_pressed = true)
	boost_button.button_up.connect(func(): boost_pressed = false)

func _touch_button(layer: CanvasLayer, title: String, offset: Vector2, left_side: bool) -> Button:
	var button := Button.new()
	button.text = title
	button.custom_minimum_size = Vector2(82, 68) if title != "BOOST" else Vector2(120, 68)
	if left_side:
		button.set_anchors_preset(Control.PRESET_BOTTOM_LEFT)
	else:
		button.set_anchors_preset(Control.PRESET_BOTTOM_RIGHT)
	button.position = offset
	button.add_theme_font_size_override("font_size", 20)
	layer.add_child(button)
	return button

func _update_hud() -> void:
	if status_label:
		status_label.text = "বাংলার টেসলা 3D   |   Speed: %d   |   Boost: %d%%   |   Score: %d   |   Hits: %d" % [int(speed), int(boost_charge), score, collisions]

func _random_lane() -> float:
	return [-3.7, 0.0, 3.7][rng.randi_range(0, 2)]
