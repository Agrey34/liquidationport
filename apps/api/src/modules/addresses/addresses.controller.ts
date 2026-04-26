import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseUUIDPipe, Req } from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';

@Controller('v1/addresses')
@UseGuards(SupabaseAuthGuard)
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Post()
  create(@Req() req, @Body() createAddressDto: CreateAddressDto) {
    return this.addressesService.create(req.user.id, createAddressDto);
  }

  @Get()
  findAll(@Req() req) {
    return this.addressesService.findAllForUser(req.user.id);
  }

  @Get(':id')
  findOne(@Req() req, @Param('id', ParseUUIDPipe) id: string) {
    return this.addressesService.findOne(id, req.user.id);
  }

  @Patch(':id')
  update(
    @Req() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAddressDto: UpdateAddressDto,
  ) {
    return this.addressesService.update(id, req.user.id, updateAddressDto);
  }

  @Delete(':id')
  remove(@Req() req, @Param('id', ParseUUIDPipe) id: string) {
    return this.addressesService.remove(id, req.user.id);
  }
}
