import {
  AmbientLight,
  BoxGeometry,
  CatmullRomCurve3,
  DirectionalLight,
  Euler,
  Fog,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  PerspectiveCamera,
  Quaternion,
  Scene,
  TorusKnotGeometry,
  Vector2,
  Vector3,
  type BufferGeometry,
  type ColorRepresentation,
  type Material,
} from "three"

export interface OrbitCameraControllerOptions {
  target?: Vector3
  radius?: number
  minRadius?: number
  maxRadius?: number
  azimuth?: number
  polar?: number
  minPolar?: number
  maxPolar?: number
  rotateSpeed?: number
  zoomSpeed?: number
  panSpeed?: number
  damping?: number
}

export interface OrbitCameraState {
  target: Vector3
  radius: number
  azimuth: number
  polar: number
}

export function createOrbitCameraRig(options: OrbitCameraControllerOptions = {}): {
  camera: PerspectiveCamera
  orbit: OrbitCameraController
} {
  const camera = new PerspectiveCamera(45, 1, 0.1, 1000)
  const orbit = new OrbitCameraController(camera, options)
  return { camera, orbit }
}

export class OrbitCameraController {
  private readonly camera: PerspectiveCamera
  private readonly state: OrbitCameraState
  private readonly minRadius: number
  private readonly maxRadius: number
  private readonly minPolar: number
  private readonly maxPolar: number
  private readonly rotateSpeed: number
  private readonly zoomSpeed: number
  private readonly panSpeed: number
  private readonly damping: number

  private azimuthVelocity = 0
  private polarVelocity = 0
  private zoomVelocity = 0
  private panVelocity = new Vector2(0, 0)

  constructor(camera: PerspectiveCamera, options: OrbitCameraControllerOptions = {}) {
    this.camera = camera
    this.state = {
      target: options.target?.clone() ?? new Vector3(0, 0, 0),
      radius: options.radius ?? Math.max(0.001, camera.position.length() || 6),
      azimuth: options.azimuth ?? 0,
      polar: options.polar ?? Math.PI / 2,
    }

    this.minRadius = options.minRadius ?? 0.2
    this.maxRadius = options.maxRadius ?? 300
    this.minPolar = options.minPolar ?? 0.01
    this.maxPolar = options.maxPolar ?? Math.PI - 0.01
    this.rotateSpeed = options.rotateSpeed ?? 1
    this.zoomSpeed = options.zoomSpeed ?? 1
    this.panSpeed = options.panSpeed ?? 1
    this.damping = options.damping ?? 0.84

    this.state.radius = this.clamp(this.state.radius, this.minRadius, this.maxRadius)
    this.state.polar = this.clamp(this.state.polar, this.minPolar, this.maxPolar)
    this.syncCamera()
  }

  public getState(): OrbitCameraState {
    return {
      target: this.state.target.clone(),
      radius: this.state.radius,
      azimuth: this.state.azimuth,
      polar: this.state.polar,
    }
  }

  public setTarget(target: Vector3): void {
    this.state.target.copy(target)
    this.syncCamera()
  }

  public rotate(deltaAzimuth: number, deltaPolar: number): void {
    this.azimuthVelocity += deltaAzimuth * this.rotateSpeed
    this.polarVelocity += deltaPolar * this.rotateSpeed
  }

  public zoom(delta: number): void {
    this.zoomVelocity += delta * this.zoomSpeed
  }

  public pan(deltaX: number, deltaY: number): void {
    this.panVelocity.x += deltaX * this.panSpeed
    this.panVelocity.y += deltaY * this.panSpeed
  }

  public update(deltaSeconds: number): void {
    const dt = Math.max(0, deltaSeconds)

    this.state.azimuth += this.azimuthVelocity * dt
    this.state.polar = this.clamp(this.state.polar + this.polarVelocity * dt, this.minPolar, this.maxPolar)
    this.state.radius = this.clamp(this.state.radius + this.zoomVelocity * dt, this.minRadius, this.maxRadius)

    if (this.panVelocity.lengthSq() > 0) {
      const forward = this.state.target.clone().sub(this.camera.position).normalize()
      const right = new Vector3().crossVectors(forward, this.camera.up).normalize()
      const up = this.camera.up.clone().normalize()
      this.state.target.addScaledVector(right, this.panVelocity.x * dt)
      this.state.target.addScaledVector(up, this.panVelocity.y * dt)
    }

    const dampingFactor = Math.pow(this.damping, Math.max(1, dt * 60))
    this.azimuthVelocity *= dampingFactor
    this.polarVelocity *= dampingFactor
    this.zoomVelocity *= dampingFactor
    this.panVelocity.multiplyScalar(dampingFactor)

    this.syncCamera()
  }

  private syncCamera(): void {
    const sinPolar = Math.sin(this.state.polar)
    const offset = new Vector3(
      this.state.radius * sinPolar * Math.sin(this.state.azimuth),
      this.state.radius * Math.cos(this.state.polar),
      this.state.radius * sinPolar * Math.cos(this.state.azimuth),
    )
    this.camera.position.copy(this.state.target).add(offset)
    this.camera.lookAt(this.state.target)
    this.camera.updateProjectionMatrix()
    this.camera.updateMatrixWorld()
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value))
  }
}

export interface InstancedScatterOptions {
  count: number
  seed?: number
  extent?: Vector3 | [number, number, number]
  minScale?: number
  maxScale?: number
  yRotationOnly?: boolean
}

export interface InstancedScatterResult {
  mesh: InstancedMesh
  center: Vector3
  radius: number
}

export interface MassiveScatterFieldOptions extends InstancedScatterOptions {
  color?: ColorRepresentation
  geometry?: BufferGeometry
  material?: Material | Material[]
}

function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 4294967296
  }
}

export function createInstancedScatter(
  geometry: BufferGeometry,
  material: Material | Material[],
  options: InstancedScatterOptions,
): InstancedScatterResult {
  const count = Math.max(1, Math.floor(options.count))
  const extent =
    options.extent instanceof Vector3
      ? options.extent.clone()
      : Array.isArray(options.extent)
        ? new Vector3(options.extent[0], options.extent[1], options.extent[2])
        : new Vector3(20, 10, 20)
  const minScale = options.minScale ?? 0.35
  const maxScale = options.maxScale ?? 1.8
  const yRotationOnly = options.yRotationOnly ?? false
  const random = createSeededRandom(options.seed ?? 12345)

  const mesh = new InstancedMesh(geometry, material, count)
  const tempMatrix = new Matrix4()
  const tempPosition = new Vector3()
  const tempScale = new Vector3()
  const tempQuaternion = new Quaternion()
  const tempEuler = new Euler()
  const maxExtent = new Vector3(extent.x * 0.5, extent.y * 0.5, extent.z * 0.5)

  let radius = 0

  for (let i = 0; i < count; i++) {
    tempPosition.set(
      (random() * 2 - 1) * maxExtent.x,
      (random() * 2 - 1) * maxExtent.y,
      (random() * 2 - 1) * maxExtent.z,
    )

    if (yRotationOnly) {
      tempEuler.set(0, random() * Math.PI * 2, 0)
    } else {
      tempEuler.set(random() * Math.PI * 2, random() * Math.PI * 2, random() * Math.PI * 2)
    }
    tempQuaternion.setFromEuler(tempEuler)

    const uniformScale = minScale + random() * Math.max(0.0001, maxScale - minScale)
    tempScale.set(uniformScale, uniformScale, uniformScale)

    tempMatrix.compose(tempPosition, tempQuaternion, tempScale)
    mesh.setMatrixAt(i, tempMatrix)

    const dist = tempPosition.length() + uniformScale
    if (dist > radius) {
      radius = dist
    }
  }

  mesh.instanceMatrix.needsUpdate = true
  mesh.computeBoundingSphere()

  return {
    mesh,
    center: new Vector3(0, 0, 0),
    radius,
  }
}

export function createMassiveScatterField(options: MassiveScatterFieldOptions): InstancedScatterResult {
  const geometry = options.geometry ?? new BoxGeometry(1, 1, 1)
  const material = options.material ?? new MeshStandardMaterial({ color: options.color ?? 0xffffff, roughness: 0.9 })

  return createInstancedScatter(geometry, material, options)
}

export interface Keyframe {
  time: number
  position?: Vector3
  rotation?: Euler
  scale?: Vector3
}

export interface KeyframeAnimatorOptions {
  loop?: boolean
  pingPong?: boolean
}

export interface SimpleKeyframe {
  time: number
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: [number, number, number]
}

export class KeyframeAnimator {
  private readonly target: Object3D
  private readonly keyframes: Keyframe[]
  private readonly duration: number
  private readonly loop: boolean
  private readonly pingPong: boolean
  private time = 0
  private direction = 1

  constructor(target: Object3D, keyframes: Keyframe[], options: KeyframeAnimatorOptions = {}) {
    if (keyframes.length < 2) {
      throw new Error("KeyframeAnimator requires at least two keyframes")
    }

    this.target = target
    this.keyframes = [...keyframes].sort((a, b) => a.time - b.time)
    this.duration = this.keyframes[this.keyframes.length - 1].time
    this.loop = options.loop ?? true
    this.pingPong = options.pingPong ?? false

    this.apply(0)
  }

  public update(deltaSeconds: number): void {
    if (this.duration <= 0) return

    this.time += Math.max(0, deltaSeconds) * this.direction

    if (this.pingPong) {
      if (this.time > this.duration) {
        this.time = this.duration
        this.direction = -1
      } else if (this.time < 0) {
        this.time = 0
        this.direction = 1
      }
    } else if (this.loop) {
      this.time = ((this.time % this.duration) + this.duration) % this.duration
    } else {
      this.time = Math.min(this.duration, Math.max(0, this.time))
    }

    this.apply(this.time)
  }

  public getTime(): number {
    return this.time
  }

  private apply(time: number): void {
    let left = this.keyframes[0]
    let right = this.keyframes[this.keyframes.length - 1]

    for (let i = 0; i < this.keyframes.length - 1; i++) {
      const start = this.keyframes[i]
      const end = this.keyframes[i + 1]
      if (time >= start.time && time <= end.time) {
        left = start
        right = end
        break
      }
    }

    const span = Math.max(0.000001, right.time - left.time)
    const t = this.clamp((time - left.time) / span, 0, 1)

    if (left.position && right.position) {
      this.target.position.copy(left.position).lerp(right.position, t)
    }

    if (left.scale && right.scale) {
      this.target.scale.copy(left.scale).lerp(right.scale, t)
    }

    if (left.rotation && right.rotation) {
      const startQ = new Quaternion().setFromEuler(left.rotation)
      const endQ = new Quaternion().setFromEuler(right.rotation)
      this.target.quaternion.copy(startQ).slerp(endQ, t)
    }

    this.target.updateMatrixWorld()
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value))
  }
}

export function createAnimatedTransformNode(
  keyframes: SimpleKeyframe[],
  options: KeyframeAnimatorOptions = {},
): { node: Object3D; animator: KeyframeAnimator } {
  const node = new Object3D()
  const mapped: Keyframe[] = keyframes.map((keyframe) => ({
    time: keyframe.time,
    position: keyframe.position ? new Vector3(...keyframe.position) : undefined,
    rotation: keyframe.rotation ? new Euler(...keyframe.rotation) : undefined,
    scale: keyframe.scale ? new Vector3(...keyframe.scale) : undefined,
  }))

  const animator = new KeyframeAnimator(node, mapped, options)
  return { node, animator }
}

export interface CinematicScenePresetOptions {
  fogColor?: number
  fogNear?: number
  fogFar?: number
  cameraFov?: number
  cameraNear?: number
  cameraFar?: number
  cameraRadius?: number
  ambientIntensity?: number
  keyLightIntensity?: number
  fillLightIntensity?: number
  rimLightIntensity?: number
}

export interface CinematicScenePreset {
  scene: Scene
  camera: PerspectiveCamera
  orbit: OrbitCameraController
  keyLight: DirectionalLight
  fillLight: DirectionalLight
  rimLight: DirectionalLight
  ambientLight: AmbientLight
}

export function createCinematicScenePreset(options: CinematicScenePresetOptions = {}): CinematicScenePreset {
  const scene = new Scene()
  scene.fog = new Fog(options.fogColor ?? 0x05060a, options.fogNear ?? 8, options.fogFar ?? 120)

  const ambientLight = new AmbientLight(0xffffff, options.ambientIntensity ?? 0.2)
  const keyLight = new DirectionalLight(0xfff2d1, options.keyLightIntensity ?? 1.4)
  keyLight.position.set(14, 20, 12)
  const fillLight = new DirectionalLight(0x9ec7ff, options.fillLightIntensity ?? 0.75)
  fillLight.position.set(-12, 8, 10)
  const rimLight = new DirectionalLight(0xffb58f, options.rimLightIntensity ?? 0.9)
  rimLight.position.set(0, 8, -16)

  scene.add(ambientLight)
  scene.add(keyLight)
  scene.add(fillLight)
  scene.add(rimLight)

  const camera = new PerspectiveCamera(
    options.cameraFov ?? 45,
    1,
    options.cameraNear ?? 0.1,
    options.cameraFar ?? 1000,
  )

  const orbit = new OrbitCameraController(camera, {
    radius: options.cameraRadius ?? 12,
    target: new Vector3(0, 0, 0),
    minRadius: 1,
    maxRadius: 300,
    damping: 0.86,
    rotateSpeed: 1,
    panSpeed: 0.8,
    zoomSpeed: 1.4,
  })

  orbit.update(0)

  return {
    scene,
    camera,
    orbit,
    keyLight,
    fillLight,
    rimLight,
    ambientLight,
  }
}

export interface CameraRailPoint {
  position: [number, number, number]
  lookAt?: [number, number, number]
}

export interface CameraRailControllerOptions {
  loop?: boolean
  speed?: number
}

export class CameraRailController {
  private readonly camera: PerspectiveCamera
  private readonly path: CatmullRomCurve3
  private readonly lookAtPath: CatmullRomCurve3
  private readonly speed: number
  private readonly loop: boolean
  private t = 0

  constructor(camera: PerspectiveCamera, points: CameraRailPoint[], options: CameraRailControllerOptions = {}) {
    if (points.length < 2) {
      throw new Error("CameraRailController requires at least two points")
    }

    this.camera = camera
    this.speed = options.speed ?? 0.08
    this.loop = options.loop ?? true

    const pathPoints = points.map((point) => new Vector3(point.position[0], point.position[1], point.position[2]))
    const lookAtPoints = points.map((point) => {
      const lookAt = point.lookAt ?? [0, 0, 0]
      return new Vector3(lookAt[0], lookAt[1], lookAt[2])
    })

    this.path = new CatmullRomCurve3(pathPoints, this.loop, "catmullrom", 0.5)
    this.lookAtPath = new CatmullRomCurve3(lookAtPoints, this.loop, "catmullrom", 0.5)
    this.update(0)
  }

  public update(deltaSeconds: number): void {
    const dt = Math.max(0, deltaSeconds)
    this.t += dt * this.speed

    if (this.loop) {
      this.t = this.t % 1
    } else {
      this.t = Math.min(1, this.t)
    }

    const position = this.path.getPointAt(this.t)
    const lookAt = this.lookAtPath.getPointAt(this.t)
    this.camera.position.copy(position)
    this.camera.lookAt(lookAt)
    this.camera.updateProjectionMatrix()
    this.camera.updateMatrixWorld()
  }

  public getProgress(): number {
    return this.t
  }

  public setProgress(progress: number): void {
    this.t = this.loop ? ((progress % 1) + 1) % 1 : Math.min(1, Math.max(0, progress))
    this.update(0)
  }
}

export interface ShowcaseSceneOptions {
  instanceCount?: number
  worldExtent?: [number, number, number]
  seed?: number
}

export interface ShowcaseSceneRig {
  scene: Scene
  camera: PerspectiveCamera
  orbit: OrbitCameraController
  rail: CameraRailController
  update: (deltaSeconds: number) => void
  focusNode: Object3D
}

export function createShowcaseScene(options: ShowcaseSceneOptions = {}): ShowcaseSceneRig {
  const preset = createCinematicScenePreset({
    cameraRadius: 18,
    keyLightIntensity: 1.6,
    fillLightIntensity: 0.9,
    rimLightIntensity: 1.1,
  })

  const floor = new Mesh(
    new PlaneGeometry(220, 220, 1, 1),
    new MeshStandardMaterial({
      color: 0x0f1119,
      roughness: 0.95,
      metalness: 0.05,
    }),
  )
  floor.rotation.x = -Math.PI / 2
  floor.position.y = -3.2
  floor.receiveShadow = true
  preset.scene.add(floor)

  const scatter = createMassiveScatterField({
    count: options.instanceCount ?? 14000,
    seed: options.seed ?? 4242,
    extent: options.worldExtent ?? [180, 28, 180],
    minScale: 0.2,
    maxScale: 2.4,
    color: 0x8fb7ff,
  })
  scatter.mesh.castShadow = true
  scatter.mesh.receiveShadow = true

  const cluster = new Group()
  cluster.add(scatter.mesh)
  preset.scene.add(cluster)

  const focusNode = new Mesh(
    new TorusKnotGeometry(1.3, 0.42, 220, 48),
    new MeshStandardMaterial({
      color: 0xffd78a,
      roughness: 0.35,
      metalness: 0.7,
      emissive: 0x24170a,
      emissiveIntensity: 0.5,
    }),
  )
  focusNode.castShadow = true
  focusNode.receiveShadow = true
  focusNode.position.set(0, 0, 0)
  preset.scene.add(focusNode)

  const { node: animatedFocus, animator: focusAnimator } = createAnimatedTransformNode(
    [
      { time: 0, position: [0, -0.6, 0], rotation: [0, 0, 0], scale: [0.9, 0.9, 0.9] },
      { time: 2.5, position: [0, 0.6, 0], rotation: [0, Math.PI, 0], scale: [1.1, 1.1, 1.1] },
      { time: 5, position: [0, -0.6, 0], rotation: [0, Math.PI * 2, 0], scale: [0.9, 0.9, 0.9] },
    ],
    { loop: true },
  )

  const rail = new CameraRailController(
    preset.camera,
    [
      { position: [0, 6, 24], lookAt: [0, 0, 0] },
      { position: [22, 5, 16], lookAt: [0, 0, 0] },
      { position: [28, 7, -4], lookAt: [0, 0, 0] },
      { position: [8, 9, -24], lookAt: [0, 0, 0] },
      { position: [-20, 6, -14], lookAt: [0, 0, 0] },
      { position: [-24, 8, 10], lookAt: [0, 0, 0] },
    ],
    { loop: true, speed: 0.035 },
  )

  const startY = focusNode.position.y
  let time = 0

  return {
    scene: preset.scene,
    camera: preset.camera,
    orbit: preset.orbit,
    rail,
    focusNode: focusNode,
    update: (deltaSeconds: number) => {
      const dt = Math.max(0, deltaSeconds)
      time += dt
      focusAnimator.update(dt)
      focusNode.position.x = animatedFocus.position.x
      focusNode.position.y = startY + animatedFocus.position.y
      focusNode.position.z = animatedFocus.position.z
      focusNode.quaternion.copy(animatedFocus.quaternion)
      focusNode.scale.copy(animatedFocus.scale)
      cluster.rotation.y += dt * 0.08
      const pulse = 0.9 + (Math.sin(time * 1.7) + 1) * 0.35
      preset.keyLight.intensity = 1.2 + pulse * 0.4
      preset.fillLight.intensity = 0.7 + pulse * 0.2
      preset.rimLight.intensity = 0.8 + pulse * 0.25
    },
  }
}
