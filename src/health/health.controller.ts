import { Controller , Get} from '@nestjs/common';
import { HealthCheckService, TypeOrmHealthIndicator , HttpHealthIndicator , HealthCheck , PrismaHealthIndicator} from '@nestjs/terminus';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';

@Controller('health')
export class HealthController {
    constructor(
        private health: HealthCheckService,
        private http: HttpHealthIndicator,
        private prismaHealth: PrismaHealthIndicator,
        private prisma: PrismaService,
    ) { }

    @Get()
    @HealthCheck()
    check() {
        return this.health.check([
            () => this.http.pingCheck('Google', 'https://google.com'),
            //() => this.http.pingCheck('Psql DB', '84.46.250.91'),
            async () => this.prismaHealth.pingCheck('prisma', this.prisma),
        ]);
    }
}
