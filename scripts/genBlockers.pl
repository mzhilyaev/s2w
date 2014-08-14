#!/usr/bin/perl
# generate Bockers.js file for s2w
# to run 
# git clone git@github.com:monicachew/abp-hostblocking.git
# cd abp-hostblocking
# git co disconnect
# run make domainlist
# genBlockers.js abp-hostblocking/tmp_out/domainlist/domains.txt> Blockers.js
#

use strict;
use Data::Dumper;
use JSON;

my $hosts = {};

### open blockers file
open(BLOCKERS, "< @ARGV[0]") || die("failed to open @ARGV[0]");
while (<BLOCKERS>) {
  chomp($_);
  $hosts->{$_} = 1;
}

#print Dumper($hosts);

### print to stdout
my $json = new JSON;
$json->pretty( 1 );
print "exports.Blockers = ";
print $json->encode( $hosts ).";\n";
