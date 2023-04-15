
import jwt, {JwtPayload, Secret, SignOptions} from "jsonwebtoken";
import {SessionService} from "../services/session-service";

const settings = {
    JWT_ACCESS_SECRET: "superpupersecret",
    JWT_REFRESH_SECRET: "superpupermegasecret",
    TOKEN_ACCESS_LIVE_TIME: {expiresIn: "10m"},
    TOKEN_REFRESH_LIVE_TIME: {expiresIn: "100m"},
}

export interface JWT extends JwtPayload {
    id: string;
    email: string;
    deviceId: string;
}

export class TokenService {
    private readonly secretAccess: Secret;
    private readonly optionsAccess: SignOptions;
    private readonly secretRefresh: Secret;
    private readonly optionsRefresh: SignOptions;


    constructor() {
        this.optionsAccess = settings.TOKEN_ACCESS_LIVE_TIME;
        this.secretAccess = settings.JWT_ACCESS_SECRET;
        this.optionsRefresh = settings.TOKEN_REFRESH_LIVE_TIME;
        this.secretRefresh = settings.JWT_REFRESH_SECRET;
    }

    public generateAccessToken(payload: object): string {
        return jwt.sign(payload, this.secretAccess, this.optionsAccess);
    }

    public generateRefreshToken(payload: object): string {
        return jwt.sign(payload, this.secretRefresh, this.optionsRefresh);
    }

    public getPayloadByAccessToken(token: string): string | JwtPayload | JWT | boolean {
        const {exp} = jwt.decode(token) as JwtPayload
        if (!exp) return false
        if (Date.now() >= exp * 1000) {
            return false
        }

        return jwt.verify(token, settings.JWT_ACCESS_SECRET)

    }

    public getPayloadByRefreshToken(token: string): string | JwtPayload | JWT | boolean {
        const {exp} = jwt.decode(token) as JwtPayload
        if (!exp) return false
        if (Date.now() >= exp * 1000) {
            return false
        }
        return jwt.verify(token, settings.JWT_REFRESH_SECRET)
    }

    public async checkTokenByBlackList(token: string): Promise<boolean> {
        const {iat, deviceId} = jwt.decode(token) as JwtPayload
        const sessionService = new SessionService();
        const session = await sessionService.findSession(deviceId);
        return iat === session?.lastActiveDate;
    }

    public async getPayloadFromToken(refreshToken: string): Promise<JWT> {
        if (!refreshToken) throw new Error;
        const isBlockedToken = await this.checkTokenByBlackList(refreshToken);
        if (isBlockedToken) throw new Error;
        const payload = await this.getPayloadByRefreshToken(refreshToken) as JWT;
        if (!payload)
            throw new Error

        return payload
    }
}