import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { AuditService } from '../audit/audit.service';
import { authenticator } from 'otplib';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private auditService: AuditService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await this.usersService.validatePassword(user, password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async login(user: any, ip?: string) {
    // For staff roles, require MFA
    const staffRoles = ['RELATIONSHIP_MANAGER', 'KYC_ANALYST', 'MLRO', 'COMPLIANCE_ADMIN', 'AUDITOR'];
    if (staffRoles.includes(user.role) && user.mfaEnabled) {
      return {
        requiresMfa: true,
        mfaToken: this.jwtService.sign(
          { sub: user.id, mfaPending: true },
          { expiresIn: '5m' },
        ),
      };
    }

    return this.generateTokens(user, ip);
  }

  async verifyMfa(mfaToken: string, totpCode: string, ip?: string) {
    // Decode the mfaToken to extract userId
    let userId: string;
    try {
      const payload = this.jwtService.verify<{ sub: string; mfaPending: boolean }>(mfaToken);
      if (!payload.mfaPending) {
        throw new UnauthorizedException('Invalid MFA token');
      }
      userId = payload.sub;
    } catch {
      throw new UnauthorizedException('Invalid or expired MFA token');
    }

    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');

    const fullUser = await this.usersService.findByEmail((user as any).email);
    if (!fullUser?.mfaSecret) {
      throw new UnauthorizedException('MFA not configured');
    }

    const isValid = authenticator.verify({
      token: totpCode,
      secret: fullUser.mfaSecret,
    });

    if (!isValid) {
      throw new UnauthorizedException('Invalid MFA code');
    }

    return this.generateTokens(fullUser, ip);
  }

  private async generateTokens(user: any, ip?: string) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    await this.usersService.updateLastLogin(user.id, ip ?? 'unknown');

    await this.auditService.log({
      userId: user.id,
      action: 'LOGIN',
      ipAddress: ip,
    });

    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: this.jwtService.sign(payload, { expiresIn: '7d' }),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        mfaEnabled: user.mfaEnabled,
      },
    };
  }
}
