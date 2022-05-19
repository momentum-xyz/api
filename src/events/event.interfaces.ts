import { JSONSchemaType, Schema } from 'ajv';
import { ApiProperty } from '@nestjs/swagger';
import { ApiPropertyOptional } from '@nestjs/swagger/dist/decorators/api-property.decorator';

export class NewEventDto {
  // TODO use JSONSchemaType, but it enable strictNullChecks
  public static schema: Schema = {
    type: 'object',
    additionalProperties: false,
    required: ['title', 'description', 'hosted_by', 'start', 'end'],
    properties: {
      title: { type: 'string', minLength: 1 },
      description: { type: 'string', minLength: 1 },
      hosted_by: { type: 'string', minLength: 1 },
      web_link: { type: ['string', 'null'], minLength: 1 },
      start: { type: 'string', format: 'date-time' },
      end: { type: 'string', format: 'date-time' },
      //integrationTypeId: { type: 'string', format: 'uuid' },
    },
  };

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  hosted_by: string;

  @ApiProperty()
  web_link: string;

  @ApiProperty({
    example: '2023-03-24T07:50:52.870Z',
    description: 'Start datetime string in ISO format',
  })
  start: string;

  @ApiProperty({
    example: '2023-03-24T07:50:52.870Z',
    description: 'End datetime string in ISO format',
  })
  end: string;
}

export class UpdateEventDto {
  // TODO use JSONSchemaType, but it enable strictNullChecks
  public static schema: Schema = {
    type: 'object',
    additionalProperties: false,
    minProperties: 1,
    required: [],
    properties: {
      title: { type: 'string', minLength: 1 },
      description: { type: 'string', minLength: 1 },
      hosted_by: { type: 'string', minLength: 1 },
      web_link: { type: ['string', 'null'], minLength: 1 },
      start: { type: 'string', format: 'date-time' },
      end: { type: 'string', format: 'date-time' },
    },
  };

  @ApiPropertyOptional()
  title: string;

  @ApiPropertyOptional()
  description: string;

  @ApiPropertyOptional()
  hosted_by: string;

  @ApiPropertyOptional()
  web_link: string;

  @ApiPropertyOptional()
  start: string;

  @ApiPropertyOptional()
  end: string;
}

export class ResponseEventDto {
  @ApiProperty({ example: '24e3c49e-1f96-44e6-917f-dfbe91bc0a5a' })
  id: string; //"24e3c49e-1f96-44e6-917f-dfbe91bc0a5a",

  @ApiProperty({ example: '4b7242fa-8b8f-4760-95d1-2302fb5e3148' })
  spaceId: string; //"4b7242fa-8b8f-4760-95d1-2302fb5e3148",

  @ApiProperty()
  integrationTypeId: string;

  @ApiProperty({ example: '' })
  title: string; //"Event Title2",

  @ApiProperty()
  description: string; //"Event Description",

  @ApiProperty()
  hosted_by: string; //"Hosted By",

  @ApiProperty({ example: '7bb2b83840e26bc39613bb75b09c2828' })
  image_hash: string; //"7bb2b83840e26bc39613bb75b09c2828",

  @ApiProperty({ example: '2022-03-24T07:50:53.000Z' })
  start: string; //"2022-03-24T07:50:53.000Z",

  @ApiProperty({ example: '2023-03-24T07:50:53.000Z' })
  end: string; //"2023-03-24T07:50:53.000Z",

  @ApiProperty()
  created: string; //"2022-03-24T12:50:26.000Z",

  @ApiProperty()
  modified: string; //"2022-03-24T12:50:26.000Z",

  @ApiProperty()
  web_link: string; //"www"

  @ApiProperty()
  spaceName: string; //"The space name"
}
