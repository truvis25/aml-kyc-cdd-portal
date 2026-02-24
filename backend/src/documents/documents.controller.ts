import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';

@ApiTags('documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload/:clientId')
  @Roles(UserRole.CLIENT, UserRole.KYC_ANALYST, UserRole.COMPLIANCE_ADMIN, UserRole.RELATIONSHIP_MANAGER)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a document for a client' })
  async upload(
    @Param('clientId') clientId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('documentType') documentType: string,
    @Request() req: any,
  ) {
    return this.documentsService.uploadDocument({
      clientId,
      uploadedById: req.user.id,
      documentType,
      fileName: file.originalname,
      fileBuffer: file.buffer,
      mimeType: file.mimetype,
      uploadedFromIp: req.ip,
    });
  }

  @Get('client/:clientId')
  @Roles(
    UserRole.RELATIONSHIP_MANAGER,
    UserRole.KYC_ANALYST,
    UserRole.MLRO,
    UserRole.COMPLIANCE_ADMIN,
    UserRole.AUDITOR,
  )
  @ApiOperation({ summary: 'Get all documents for a client' })
  async getForClient(@Param('clientId') clientId: string) {
    return this.documentsService.getDocumentsForClient(clientId);
  }
}
