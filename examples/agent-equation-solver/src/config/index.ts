import 'dotenv/config'

export const Config = {
    Agent: {
        BASE_MODEL: process.env.AGENT_BASE_MODEL || '',
    }
}
