const module = await import("./cascade.dll", { with: { type: "file" } })
const path = module.default
export default path
