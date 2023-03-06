export type Attribute = {
  display_type: string
  trait_type: string
  value: string
}

export type ProfileMetadata = {
  display_name: string
  bio: string
  email: string
  attributes?: Attribute[]
  version?: string // Current version: 1.1.0
}
